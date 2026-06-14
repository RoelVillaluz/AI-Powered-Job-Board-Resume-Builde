import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

interface LoginResponse {
    data: { token: string };
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