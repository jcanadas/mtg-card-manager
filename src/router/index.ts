import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      name: 'wishlist',
      component: () => import('../views/WishlistViewPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/purchased',
      name: 'purchased',
      component: () => import('../views/PurchasedView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// Navigation guard to check authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth check if not done yet
  if (authStore.loading) {
    await authStore.checkAuth()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isPublic = to.matched.some(record => record.meta.public)
  const isAuthenticated = authStore.user !== null

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if trying to access protected route
    next('/login')
  } else if (isPublic && isAuthenticated && to.path === '/login') {
    // Redirect to home if already authenticated and trying to access login
    next('/')
  } else {
    next()
  }
})

export default router
