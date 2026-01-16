import apiClient from '@/lib/api/client';

export const authService = {
    login: async (credentials: any) => {
        const response = await apiClient.post('/auth/login/', credentials);

        // Tokens are nested in response.data.tokens
        const tokens = response.data.tokens;
        if (tokens && tokens.access) {
            localStorage.setItem('accessToken', tokens.access);
            if (tokens.refresh) {
                localStorage.setItem('refreshToken', tokens.refresh);
            }
        }
        return response.data;
    },
    logout: async () => {
        const refresh = localStorage.getItem('refreshToken');
        if (refresh) {
            try {
                await apiClient.post('/auth/logout/', { refresh });
            } catch (error) {
                console.error("Logout error", error);
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },
    getCurrentUser: () => {
        // Decode token or fetch user profile if endpoint exists
        // For now returning null or implementing profile fetch if needed.
    },
    getProfile: async () => {
        const response = await apiClient.get('/profile/');
        return response.data;
    }
};

export const dashboardService = {
    getOverview: async () => {
        const response = await apiClient.get('/overview/');
        return response.data;
    },
    getQuickStats: async () => {
        const response = await apiClient.get('/quick-stats/');
        return response.data;
    },
    getCustomerGrowth: async () => {
        const response = await apiClient.get('/customer-growth/');
        return response.data;
    },
    getRecentActivity: async () => {
        const response = await apiClient.get('/recent-activity/');
        return response.data;
    },
    getMonthlyRevenue: async () => {
        const response = await apiClient.get('/monthly-revenue/');
        return response.data;
    }
};

export const customerService = {
    getCustomers: async (params?: any) => {
        const response = await apiClient.get('/customers/', { params });
        return response.data;
    },
    getCustomer: async (id: number) => {
        const response = await apiClient.get(`/customers/${id}/`);
        return response.data;
    },
    createCustomer: async (data: any) => {
        const response = await apiClient.post('/customers/create/', data);
        return response.data;
    },
    updateCustomer: async (id: number, data: any) => {
        const response = await apiClient.patch(`/customers/${id}/update/`, data);
        return response.data;
    },
    deleteCustomer: async (id: number) => {
        const response = await apiClient.delete(`/customers/${id}/delete/`);
        return response.data;
    },
    searchCustomers: async (params?: any) => {
        const response = await apiClient.get('/customers/search/', { params });
        return response.data;
    }
};

export const zoneService = {
    getZones: async (params?: any) => {
        const response = await apiClient.get('/zones/', { params });
        return response.data;
    },
    getZone: async (id: number) => {
        const response = await apiClient.get(`/zones/${id}/`);
        return response.data;
    },
    createZone: async (data: any) => {
        const response = await apiClient.post('/zones/', data);
        return response.data;
    },
    updateZone: async (id: number, data: any) => {
        const response = await apiClient.patch(`/zones/${id}/`, data);
        return response.data;
    },
    deleteZone: async (id: number) => {
        const response = await apiClient.delete(`/zones/${id}/`);
        return response.data;
    }
};

export const mikrotikService = {
    // Routers
    getRouters: async (params?: any) => {
        const response = await apiClient.get('/routers/', { params });
        return response.data;
    },
    getRouter: async (id: number) => {
        const response = await apiClient.get(`/routers/${id}/`);
        return response.data;
    },
    createRouter: async (data: any) => {
        const response = await apiClient.post('/routers/create/', data);
        return response.data;
    },
    updateRouter: async (id: number, data: any) => {
        const response = await apiClient.patch(`/routers/${id}/`, data);
        return response.data;
    },
    deleteRouter: async (id: number) => {
        const response = await apiClient.delete(`/routers/${id}/`);
        return response.data;
    },
    testRouter: async (id: number) => {
        const response = await apiClient.post(`/routers/${id}/test/`);
        return response.data;
    },

    // Queue Profiles
    getQueueProfiles: async (params?: any) => {
        const response = await apiClient.get('/queue-profiles/', { params });
        return response.data;
    },

    // Sync Logs
    getSyncLogs: async (params?: any) => {
        const response = await apiClient.get('/sync-logs/', { params });
        return response.data;
    },

    // Sync Package to Router
    syncPackageToRouter: async (packageId: number, routerId: number) => {
        const response = await apiClient.post(`/sync/package/${packageId}/router/${routerId}/`);
        return response.data;
    }
};

export const packageService = {
    getPackages: async (params?: any) => {
        const response = await apiClient.get('/packages/', { params });
        return response.data;
    },
    getPackage: async (id: number) => {
        const response = await apiClient.get(`/packages/${id}/`);
        return response.data;
    },
    createPackage: async (data: any) => {
        const response = await apiClient.post('/packages/create/', data);
        return response.data;
    },
    updatePackage: async (id: number, data: any) => {
        const response = await apiClient.patch(`/packages/${id}/update/`, data);
        return response.data;
    },
    deletePackage: async (id: number) => {
        const response = await apiClient.delete(`/packages/${id}/delete/`);
        return response.data;
    }
};

export const subscriptionService = {
    getSubscriptions: async (params?: any) => {
        const response = await apiClient.get('/subscriptions/', { params });
        return response.data;
    },
    getSubscription: async (id: number) => {
        const response = await apiClient.get(`/subscriptions/${id}/`);
        return response.data;
    },
    createSubscription: async (data: any) => {
        const response = await apiClient.post('/subscriptions/create/', data);
        return response.data;
    },
    updateSubscription: async (id: number, data: any) => {
        const response = await apiClient.patch(`/subscriptions/${id}/update/`, data);
        return response.data;
    },
    deleteSubscription: async (id: number) => {
        const response = await apiClient.delete(`/subscriptions/${id}/delete/`);
        return response.data;
    },
    activateSubscription: async (id: number) => {
        const response = await apiClient.post(`/subscriptions/${id}/activate/`);
        return response.data;
    },
    suspendSubscription: async (id: number) => {
        const response = await apiClient.post(`/subscriptions/${id}/suspend/`);
        return response.data;
    },
    syncSubscription: async (id: number) => {
        const response = await apiClient.post(`/subscriptions/${id}/sync/`);
        return response.data;
    },
    getSubscriptionHistory: async (id: number, params?: any) => {
        const response = await apiClient.get(`/subscriptions/${id}/history/`, { params });
        return response.data;
    },
    getActiveConnections: async () => {
        const response = await apiClient.get('/subscriptions/active-connections/');
        return response.data;
    }
};

export const billService = {
    getBills: async (params?: any) => {
        const response = await apiClient.get('/bills/', { params });
        return response.data;
    },
    getBill: async (id: number) => {
        const response = await apiClient.get(`/bills/${id}/`);
        return response.data;
    },
    createBill: async (data: any) => {
        const response = await apiClient.post('/bills/create/', data);
        return response.data;
    },
    generateMonthlyBills: async (data: { year: number, month: number }) => {
        const response = await apiClient.post('/bills/generate-monthly/', data);
        return response.data;
    },
    updateBill: async (id: number, data: any) => {
        const response = await apiClient.patch(`/bills/${id}/`, data);
        return response.data;
    },
    addPayment: async (billId: number, data: any) => {
        const response = await apiClient.post(`/bills/${billId}/add-payment/`, data);
        return response.data;
    },
    deleteBill: async (id: number) => {
        const response = await apiClient.delete(`/bills/${id}/`);
        return response.data;
    }
};

export const paymentService = {
    getPayments: async (params?: any) => {
        const response = await apiClient.get('/payments/', { params });
        return response.data;
    },
    getPayment: async (id: number) => {
        const response = await apiClient.get(`/payments/${id}/`);
        return response.data;
    },
    createPayment: async (data: any) => {
        const response = await apiClient.post('/payments/create/', data);
        return response.data;
    }
};

export const invoiceService = {
    getInvoices: async (params?: any) => {
        const response = await apiClient.get('/invoices/', { params });
        return response.data;
    },
    getInvoice: async (id: number) => {
        const response = await apiClient.get(`/invoices/${id}/`);
        return response.data;
    },
    createInvoice: async (data: any) => {
        const response = await apiClient.post('/invoices/create/', data);
        return response.data;
    }
};

export const advancePaymentService = {
    getAdvancePayments: async (params?: any) => {
        const response = await apiClient.get('/advance-payments/', { params });
        return response.data;
    },
    getAdvancePayment: async (id: number) => {
        const response = await apiClient.get(`/advance-payments/${id}/`);
        return response.data;
    },
    createAdvancePayment: async (data: any) => {
        const response = await apiClient.post('/advance-payments/create/', data);
        return response.data;
    }
};

export const discountService = {
    getDiscounts: async (params?: any) => {
        const response = await apiClient.get('/discounts/', { params });
        return response.data;
    },
    getDiscount: async (id: number) => {
        const response = await apiClient.get(`/discounts/${id}/`);
        return response.data;
    },
    createDiscount: async (data: any) => {
        const response = await apiClient.post('/discounts/create/', data);
        return response.data;
    },
    updateDiscount: async (id: number, data: any) => {
        const response = await apiClient.put(`/discounts/${id}/`, data);
        return response.data;
    },
    deleteDiscount: async (id: number) => {
        const response = await apiClient.delete(`/discounts/${id}/`);
        return response.data;
    }
};

export const refundService = {
    getRefunds: async (params?: any) => {
        const response = await apiClient.get('/refunds/', { params });
        return response.data;
    },
    getRefund: async (id: number) => {
        const response = await apiClient.get(`/refunds/${id}/`);
        return response.data;
    },
    createRefund: async (data: any) => {
        const response = await apiClient.post('/refunds/create/', data);
        return response.data;
    },
    approveRefund: async (id: number) => {
        const response = await apiClient.post(`/refunds/${id}/approve/`);
        return response.data;
    },
    rejectRefund: async (id: number) => {
        const response = await apiClient.post(`/refunds/${id}/reject/`);
        return response.data;
    },
    completeRefund: async (id: number) => {
        const response = await apiClient.post(`/refunds/${id}/complete/`);
        return response.data;
    }
};

export const userService = {
    getUsers: async (params?: any) => {
        const response = await apiClient.get('/users/', { params });
        return response.data;
    },
    getUser: async (id: number) => {
        const response = await apiClient.get(`/users/${id}/`);
        return response.data;
    },
    createUser: async (data: any) => {
        const response = await apiClient.post('/users/create/', data);
        return response.data;
    },
    updateUser: async (id: number, data: any) => {
        const response = await apiClient.patch(`/users/${id}/`, data);
        return response.data;
    },
    deleteUser: async (id: number) => {
        const response = await apiClient.delete(`/users/${id}/`);
        return response.data;
    },
    getLoginHistory: async (params?: any) => {
        const response = await apiClient.get('/login-history/', { params });
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await apiClient.post('/change-password/', data);
        return response.data;
    }
};
