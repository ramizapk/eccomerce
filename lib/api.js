const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('admin_token');
        }
        return null;
    }

    async request(endpoint, options = {}) {
        const token = this.getToken();

        const headers = {
            'Accept': 'application/json',
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Something went wrong');
                error.errors = data.errors;
                error.status = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async login(credentials) {
        return this.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async logout() {
        return this.request('/admin/logout', {
            method: 'POST',
        });
    }

    async getProfile() {
        return this.request('/admin/profile');
    }

    // Categories
    async getCategories(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/categories${query ? `?${query}` : ''}`);
    }

    async createCategory(data) {
        return this.request('/admin/categories', {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async updateCategory(id, data) {
        if (data instanceof FormData && !data.has('_method')) {
            data.append('_method', 'PUT');
        }

        return this.request(`/admin/categories/${id}`, {
            method: data instanceof FormData ? 'POST' : 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async deleteCategory(id) {
        return this.request(`/admin/categories/${id}`, {
            method: 'DELETE',
        });
    }

    // Options
    async getOptions() {
        return this.request('/options');
    }

    async createOption(data) {
        return this.request('/admin/options', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateOption(id, data) {
        return this.request(`/admin/options/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteOption(id) {
        return this.request(`/admin/options/${id}`, {
            method: 'DELETE',
        });
    }

    // Stores
    async getStores(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/stores${query ? `?${query}` : ''}`);
    }

    async getStore(id) {
        return this.request(`/admin/stores/${id}`);
    }

    async createStore(data) {
        return this.request('/admin/stores', {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async updateStore(id, data) {
        return this.request(`/admin/stores/${id}`, {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async updateStoreStatus(id, status, rejectionReason = null) {
        const body = { status };
        if (rejectionReason) {
            body.rejection_reason = rejectionReason;
        }
        return this.request(`/admin/stores/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    async deleteStore(id) {
        return this.request(`/admin/stores/${id}`, {
            method: 'DELETE',
        });
    }

    // Users (Customers & Admins)
    async getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/users${query ? `?${query}` : ''}`);
    }

    async createUser(data) {
        return this.request('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateUser(id, data) {
        return this.request(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteUser(id) {
        return this.request(`/admin/users/${id}`, {
            method: 'DELETE',
        });
    }

    // Settings
    async getSettings() {
        return this.request('/admin/settings');
    }

    async updateSettings(settings) {
        return this.request('/admin/settings', {
            method: 'POST',
            body: JSON.stringify({ settings }),
        });
    }

    // Stats
    async getStats() {
        return this.request('/admin/dashboard/stats');
    }

    async getRecentActivities() {
        return this.request('/admin/dashboard/activities');
    }

    // Brands
    async getBrands(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/brands${query ? `?${query}` : ''}`);
    }

    async createBrand(data) {
        return this.request('/admin/brands', {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async updateBrand(id, data) {
        if (data instanceof FormData && !data.has('_method')) {
            data.append('_method', 'PUT');
        }

        return this.request(`/admin/brands/${id}`, {
            method: data instanceof FormData ? 'POST' : 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async deleteBrand(id) {
        return this.request(`/admin/brands/${id}`, {
            method: 'DELETE',
        });
    }

    // Orders
    async getOrders(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/orders${query ? `?${query}` : ''}`);
    }

    async getOrder(id) {
        return this.request(`/admin/orders/${id}`);
    }

    async updateOrderStatus(orderId, status) {
        return this.request(`/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async updateOrderPaymentStatus(orderId, paymentStatus) {
        return this.request(`/admin/orders/${orderId}/payment-status`, {
            method: 'PATCH',
            body: JSON.stringify({ payment_status: paymentStatus }),
        });
    }

    // Profile Management
    async updateProfile(data) {
        return this.request('/profile/update', {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async changePassword(data) {
        return this.request('/profile/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Products Management
    async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/products${query ? `?${query}` : ''}`);
    }

    async getProduct(id) {
        return this.request(`/admin/products/${id}`);
    }

    async createProduct(data) {
        return this.request('/admin/products', {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async updateProduct(id, data) {
        return this.request(`/admin/products/${id}`, {
            method: 'POST', // Using POST with _method=PUT for FormData support if needed, or stick to PUT if JSON
            // Note: Laravel can struggle with PUT + Multipart. Safest is POST with _method=PUT or just standard PUT if JSON. 
            // Admin controller handles both but for files we normally utilize POST. 
            // Let's assume the frontend will append _method='PUT' if FormData.
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }

    async deleteProduct(id) {
        return this.request(`/admin/products/${id}`, {
            method: 'DELETE',
        });
    }

    async updateProductStatus(id, status) {
        return this.request(`/admin/products/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async updateProductMainStatus(id, main_status) {
        return this.request(`/admin/products/${id}/main-status`, {
            method: 'PATCH',
            body: JSON.stringify({ main_status }),
        });
    }

    async deleteProductImage(productId, imageId) {
        return this.request(`/admin/products/${productId}/images/${imageId}`, {
            method: 'DELETE',
        });
    }

    async deleteProductVariant(productId, variantId) {
        return this.request(`/admin/products/${productId}/variants/${variantId}`, {
            method: 'DELETE',
        });
    }

    // Curated Products
    async getCuratedProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/curated-products${query ? `?${query}` : ''}`);
    }

    async addCuratedProduct(product_id) {
        return this.request('/admin/curated-products', {
            method: 'POST',
            body: JSON.stringify({ product_id }),
        });
    }

    async removeCuratedProduct(product_id) {
        return this.request(`/admin/curated-products/${product_id}`, {
            method: 'DELETE',
        });
    }
}

export default new ApiService();
