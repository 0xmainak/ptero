import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Helper functions
const getUserFromCookie = (request: NextRequest) => {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(cookie => {
      const [name, value] = cookie.split('=');
      return [name, decodeURIComponent(value)];
    })
  );
  
  try {
    return cookies.discord_user ? JSON.parse(cookies.discord_user) : null;
  } catch {
    return null;
  }
};

// Server creation endpoint
export async function POST(request: NextRequest) {
  // Authentication check
  const user = getUserFromCookie(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON input' }, { status: 400 });
  }

  // Environment check
  const apiKey = process.env.PTERO_API_KEY;
  const panelUrl = process.env.PTERO_PANEL_URL;
  if (!apiKey || !panelUrl) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }
  // Validate input parameters
  if (body.user_uploaded_files === undefined) {
    return Response.json({
      errors: [{
        code: 'ValidationException',
        status: '422',
        detail: 'The User Uploaded Files variable field is required.'
      }]
    }, { status: 422 });
  }

  if (body.auto_update === undefined) {
    return Response.json({
      errors: [{
        code: 'ValidationException',
        status: '422',
        detail: 'The Auto Update variable field is required.'
      }]
    }, { status: 422 });
  }
  
  // Convert string values to boolean if necessary
  if (typeof body.auto_update === 'string') {
    body.auto_update = body.auto_update === '1' || body.auto_update === 'true';
  }
  
  if (typeof body.user_uploaded_files === 'string') {
    body.user_uploaded_files = body.user_uploaded_files === '1' || body.user_uploaded_files === 'true';
  }
  // Extract configuration params with defaults
  const mainFile = body.mainFile || 'main.py';
  const pyPackages = body.extraPackages || '';
  const userUpload = body.user_uploaded_files ? '1' : '0';
  const autoUpdate = body.auto_update ? '1' : '0';

  // Validate egg-specific variables
  if (!body.mainFile) {
    return Response.json({
      errors: [{
        code: 'ValidationException',
        status: '422',
        detail: 'The App py file variable field is required.',
      }],
    }, { status: 422 });
  }

  if (!body.extraPackages) {
    body.extraPackages = ''; // Default to empty string
  }
  
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    // 1. Get or create Pterodactyl user
    let pterodactylUserId;
    
    try {
      const userRes = await axios.get(
        `${panelUrl}/api/application/users?filter[external_id]=${user.id}`,
        { headers }
      );
      
      if (userRes.data.data.length > 0) {
        pterodactylUserId = userRes.data.data[0].attributes.id;
      }
    } catch (error) {
      console.error('Error finding user:', (error as Error).message);
    }

    if (!pterodactylUserId) {
      const userCreateRes = await axios.post(
        `${panelUrl}/api/application/users`,
        {
          username: user.username.toLowerCase().replace(/[^a-z0-9]/g, ''),
          email: user.email,
          first_name: user.username,
          last_name: 'Bot',
          external_id: user.id,
          password: Math.random().toString(36).substring(2, 15),
        },
        { headers }
      );
      pterodactylUserId = userCreateRes.data.attributes.id;
    }

    // 2. Find available allocation
    const nodesRes = await axios.get(`${panelUrl}/api/application/nodes`, { headers });
    
    let selectedNodeId = null;
    let selectedAllocationId = null;

    for (const node of nodesRes.data.data) {
      const allocRes = await axios.get(
        `${panelUrl}/api/application/nodes/${node.attributes.id}/allocations`,
        { headers }
      );
      
      const freeAllocation = allocRes.data.data.find((a: any) => !a.attributes.assigned);
      if (freeAllocation) {
        selectedNodeId = node.attributes.id;
        selectedAllocationId = freeAllocation.attributes.id;
        break;
      }
    }

    if (!selectedAllocationId) {
      return Response.json({ error: 'No available server allocation found' }, { status: 503 });
    }    // 3. Generate startup script
    const startupScript = `
if [[ -d .git ]] && [[ "${autoUpdate}" == "1" ]]; then git pull; fi;
if [[ -n "${pyPackages}" ]]; then pip install -U --prefix .local ${pyPackages}; fi;
if [[ -f /home/container/\${REQUIREMENTS_FILE} ]]; then pip install -U --prefix .local -r /home/container/\${REQUIREMENTS_FILE}; fi;
/usr/local/bin/python /home/container/\${PY_FILE}
    `.trim().replace(/\n/g, ' ');

    // 4. Create server
    const serverData = {
      name: `${user.username}-bot`,
      user: pterodactylUserId,
      egg: 16,
      docker_image: 'ghcr.io/parkervcp/yolks:python_3.12',
      startup: startupScript,      environment: {
        PY_FILE: mainFile,
        REQUIREMENTS_FILE: 'requirements.txt',
        USER_UPLOAD: userUpload,
        AUTO_UPDATE: autoUpdate,
        PY_PACKAGES: pyPackages,
      },
      limits: {
        memory: 200,
        swap: 0,
        disk: 500,
        io: 500,
        cpu: 20,
      },
      feature_limits: {
        databases: 0,
        allocations: 1,
        backups: 0,
      },
      allocation: {
        default: selectedAllocationId,
      },
    };

    const serverRes = await axios.post(
      `${panelUrl}/api/application/servers`,
      serverData,
      { headers }
    );

    return Response.json({
      success: true,
      server: serverRes.data.attributes,
    });
    
  } catch (error: any) {
    console.error('Pterodactyl API error:', error.response?.data || error.message);
    return Response.json(
      { error: 'Failed to create server', details: error.response?.data || error.message }, 
      { status: 500 }
    );
  }
}

// Discord OAuth handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }
  
  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    // Get user info
    const { access_token } = tokenResponse.data;
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    const user = {
      id: userResponse.data.id,
      username: userResponse.data.username,
      email: userResponse.data.email,
      avatar: userResponse.data.avatar,
    };
    
    // Set cookie and redirect
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('discord_user', JSON.stringify(user), {
      httpOnly: true,
      maxAge: 86400,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Discord authentication error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}

