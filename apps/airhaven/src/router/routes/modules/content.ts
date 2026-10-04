import type { RouteRecordRaw } from 'vue-router'

const content: RouteRecordRaw = { path: '/content', name: 'Content', redirect: '/content/videos', meta: { title: '内容管理', icon: 'lucide:clapperboard' }, children: [{ path: 'videos', name: 'ContentVideos', component: () => import('../../../views/Videos.vue'), meta: { title: '视频管理', permissions: ['video:read'] } }] }
export default content
