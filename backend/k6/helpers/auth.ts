import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';

interface LoginResponse {
    data: {
        token: string;
    };
}

export function login(email: string, password: string): string {
    const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email, password }),
        { headers: { 'Content-Type': 'application/json' } },
    );

    if (res.status !== 200) {
        throw new Error(`Login failed: ${res.status} ${res.body}`);
    }

    return (res.json() as unknown as LoginResponse).data.token;
}

const K6_BYPASS_TOKEN = __ENV.K6_BYPASS_TOKEN || '';

export function authHeaders(token: string) {
    return {
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
            'x-k6-bypass':   K6_BYPASS_TOKEN,
        },
    };
}