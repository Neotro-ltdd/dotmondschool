export const API_ROOT = import.meta.env.VITE_API_ROOT || 'https://localhost:7138';
const API_BASE_URL = `${API_ROOT}/api`;

export function getTenantId(): string {
    // 1. Check URL query params for easy local testing
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    if (tenantParam) {
        localStorage.setItem('srms_tenantId', tenantParam);
        return tenantParam;
    }
    
    // 2. In production, check window.location.hostname for custom domains
    // Example: if hostname is portal.dotmond.com, we could extract 'dotmond'
    // This logic can be expanded once production domains are purchased.
    
    // 3. Fallback to stored tenant ID, or 'dbo' for the default/admin tenant
    return localStorage.getItem('srms_tenantId') || 'dbo';
}

export async function getPublicTenantDetails(tenantId: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/public/tenant/${tenantId}`, {
            headers: {
                'X-Tenant-ID': tenantId
            }
        });
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (err) {
        console.warn(`Could not reach backend API at ${API_BASE_URL}:`, err);
        return null;
    }
}

export class ApiError extends Error {
    public status: number;
    public data?: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function handleResponse(response: Response) {
    let data;
    try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('srms_token');
            localStorage.removeItem('srms_user');
            // If we are not already on the login page, redirect
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        let message = data?.detail || data?.Detail || data?.message || data?.Message || data?.title || 'An error occurred';
        if (data?.errors) {
            const validationErrors = Object.values(data.errors).flat() as string[];
            if (validationErrors.length > 0) {
                message = validationErrors.join(' ');
            }
        }
        throw new ApiError(response.status, message, data);
    }

    return data;
}

export const api = {
    async post(endpoint: string, body: any) {
        const token = localStorage.getItem('srms_token');
        const tenantId = getTenantId();
        const isFormData = body instanceof FormData;
        
        const headers: Record<string, string> = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });

        return handleResponse(response);
    },

    async put(endpoint: string, body: any) {
        const token = localStorage.getItem('srms_token');
        const tenantId = getTenantId();
        const isFormData = body instanceof FormData;
        
        const headers: Record<string, string> = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });

        return handleResponse(response);
    },

    async get(endpoint: string) {
        const token = localStorage.getItem('srms_token');
        const tenantId = getTenantId();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });

        return handleResponse(response);
    },

    async delete(endpoint: string) {
        const token = localStorage.getItem('srms_token');
        const tenantId = getTenantId();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });

        return handleResponse(response);
    },

    async download(endpoint: string) {
        const token = localStorage.getItem('srms_token');
        const tenantId = getTenantId();
        const headers: Record<string, string> = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (tenantId) {
            headers['X-Tenant-ID'] = tenantId;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            let data;
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            } catch {
                data = null;
            }
            let message = data?.message || data?.Message || data?.title || 'An error occurred';
            if (data?.errors) {
                const validationErrors = Object.values(data.errors).flat() as string[];
                if (validationErrors.length > 0) {
                    message = validationErrors.join(' ');
                }
            }
            throw new ApiError(response.status, message, data);
        }

        return await response.blob();
    }
};
