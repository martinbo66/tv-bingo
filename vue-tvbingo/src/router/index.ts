import { createRouter, createWebHashHistory } from 'vue-router'
import ShowsList from '../components/ShowsList.vue'
import ShowDetail from '../components/ShowDetail.vue'
import CreateShowPage from '../pages/CreateShowPage.vue'
import BingoCard from '../pages/BingoCard.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: ShowsList
    },
    {
      path: '/show/:id',
      component: BingoCard,
      props: true
    },
    {
      path: '/show/:id/edit',
      component: ShowDetail,
      props: true
    },
    {
      path: '/create',
      component: CreateShowPage
    }
  ]
})

// Add navigation guard to clean up URLs
router.beforeEach((_to, _from, next) => {
  if (window.location.pathname !== '/') {
    window.history.replaceState({}, '', '/')
  }
  next()
})

export default router
