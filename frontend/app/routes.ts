import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  layout('components/layout/AppLayout.tsx', [
    index('routes/home.tsx'),
    route('dashboard', 'routes/dashboard.tsx'),
    route('nueva-transaccion',    'routes/create.tsx'),
    route('aprobaciones',  'routes/approval.tsx'),
  ]),
] satisfies RouteConfig
