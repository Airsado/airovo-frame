import type { RouteRecordRaw } from 'vue-router'

const collection: RouteRecordRaw = { path: '/collection', name: 'Collection', component: () => import('../../../views/Collection.vue'), meta: { title: '采集管理', icon: 'lucide:download', permissions: ['collection:read'] } }
export default collection
