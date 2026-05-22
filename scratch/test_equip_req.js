const axios = require('axios');

async function run() {
  const url_base = 'http://127.0.0.1:8000/api';
  
  try {
    // 1. Login as alan.turing
    const login_data = {
      username: 'alan.turing',
      password: 'testpass123'
    };
    
    console.log("Logging in...");
    const login_res = await axios.post(`${url_base}/auth/login/`, login_data);
    const access_token = login_res.data.access;
    console.log("Logged in. Access token obtained.");
    
    const headers = {
      Authorization: `Bearer ${access_token}`
    };
    
    // 2. Post equipment request for office 291
    const req_payload = {
      office: 291,
      asset_type: 'computer',
      quantity: 1,
      reason: 'Need a new computer for research',
      status: 'pending'
    };
    
    console.log("Posting equipment request with payload:", req_payload);
    const req_res = await axios.post(`${url_base}/equipment-requests/`, req_payload, { headers });
    console.log("Success! Response:", req_res.data);
    
  } catch (error) {
    console.error("Error occurred:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

run();
