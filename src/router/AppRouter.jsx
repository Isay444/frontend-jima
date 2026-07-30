import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import React from 'react'


import LoginPage from '@/pages/auth/LoginPage'
import ClientesPage from '@/pages/clientes/ClientePage'
import ClienteFormPage from '@/pages/clientes/ClienteFormPage'
import AreaPage from '@/pages/catalogos/AreaPage'
import AreaFormPage from '@/pages/catalogos/AreaFormPage'
import PuestoPage from '@/pages/catalogos/PuestoPage'
import TipoServicioPage from '@/pages/catalogos/TipoServicioPage'
import TipoTerrenoPage from '@/pages/catalogos/TipoTerrenoPage'
import MunicipioPage from '@/pages/catalogos/MunicipioPage'
import ZonaEjidalPage from '@/pages/catalogos/ZonaEjidalPage'
import PuestoFormPage from '@/pages/catalogos/PuestoFormPage'
import MunicipioFormPage from '@/pages/catalogos/MunicipioFormPage'
import ZonaEjidalFormPage from '@/pages/catalogos/ZonaEjidalForm'
import TipoServicioFormPage from '@/pages/catalogos/TipoServicioFormPage'
import TipoTerrenoFormPage from '@/pages/catalogos/TipoTerrenoFormPage'
import IngenieroPage from '@/pages/ingenieros/ingenieroPage'
import IngenieroFormPage from '@/pages/ingenieros/IngenieroFormPage'
import SubtipoTerrenoPage from '@/pages/catalogos/SubtipoTerrenoPage'
import SubtipoTerrenoFormPage from '@/pages/catalogos/SubtipoTerrenoFormPage'
import ServicioPage from '@/pages/catalogos/ServicioPage'
import ServicioFormPage from '@/pages/catalogos/ServicioFormPage'
import TrabajadoresPage from '@/pages/trabajadores/TrabajadoresPage'
import TrabajadorFormPage from '@/pages/trabajadores/TrabajadorFormPage'
import GastosDiariosPage from '@/pages/gastos/GastosDiariosPage'
import GastoDiarioFormPage from '@/pages/gastos/GastoDiarioFormPage'
import NominaPage from '@/pages/nomina/NominaPage'
import NominaFormPage from '@/pages/nomina/NominaFormPage'
import GastosFijosPage from '@/pages/gastos/GastosFijosPage'
import GastoFijoFormPage from '@/pages/gastos/GastoFijoFormPage'
import UsuariosPage from '@/pages/admin/UsuariosPage'
import UsuarioFormPage from '@/pages/admin/UsuarioFormPage'
import RolesPage from '@/pages/admin/RolesPage'
import RolFormPage from '@/pages/admin/RolFormPage'
import OrdenesPage from '@/pages/ordenes/OrdenesPage'
import OrdenFormPage from '@/pages/ordenes/OrdenFormPage'
import OrdenDetallePage from '@/pages/ordenes/OrdenDetallePage'
import ReciboFormPage from '@/pages/recibos/ReciboFormPage'
import ReportesPage from '@/pages/reportes/ReportesPage'


const SinAccesoPage = () => <div className='p-4 text-red-600 font-bold'>403 - No tienes permisos para acceder a este recurso</div>

export const AppRouter = () => {
    const router = createBrowserRouter([
        {
            path: "/login",
            element: <LoginPage />,
        },
        {
            path: "/sin-acceso",
            element: <SinAccesoPage />,
        },
        {
            path: "/",
            element: (
                <ProtectedRoute>
                    <MainLayout/>
                </ProtectedRoute>
            ),
            children: [
                {index: true, element: <Navigate to="/clientes" replace />},
                /* RUTAS DEL MÓDULO DE CLIENTES CONTROLADAS POR PERMISOS */
                { path: 'clientes', 
                    element: (
                        <ProtectedRoute permiso="CLIENTE_READ">
                          <ClientesPage />
                        </ProtectedRoute>
                      ) 
                },
                { 
                    path: 'clientes/nuevo', 
                    element: (
                      <ProtectedRoute permiso="CLIENTE_CREATE">
                        <ClienteFormPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'clientes/editar/:id', 
                    element: (
                      <ProtectedRoute permiso="CLIENTE_UPDATE">
                        <ClienteFormPage />
                      </ProtectedRoute>
                    ) 
                },
                // TERRENOS
                {
                  path: 'catalogos/subtipos-terreno',
                  element: (
                    <ProtectedRoute permiso="SUBTIPOTERRENO_READ">
                      <SubtipoTerrenoPage/>
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'catalogos/subtipos-terreno/nuevo',
                  element: (
                    <ProtectedRoute permiso="SUBTIPOTERRENO_CREATE">
                      <SubtipoTerrenoFormPage/>
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'catalogos/subtipos-terreno/editar/:id',
                  element: (
                    <ProtectedRoute permiso="SUBTIPOTERRENO_UPDATE">
                      <SubtipoTerrenoFormPage/>
                    </ProtectedRoute>
                  )
                },
                // INGENIEROS
                {
                  path: 'ingenieros', 
                  element: (
                  <ProtectedRoute permiso="INGENIERO_READ">
                    <IngenieroPage />
                  </ProtectedRoute>
                  )
                },
                { 
                  path: 'ingenieros/nuevo', 
                  element: (
                  <ProtectedRoute permiso="INGENIERO_CREATE">
                    <IngenieroFormPage />
                  </ProtectedRoute>)
                },
                { 
                  path: 'ingenieros/editar/:id', 
                  element: (
                  <ProtectedRoute permiso="INGENIERO_UPDATE">
                    <IngenieroFormPage />
                  </ProtectedRoute>
                  )
                },
                // AREAS
                { 
                    path: 'catalogos/areas', 
                    element: (
                      <ProtectedRoute permiso="AREA_READ">
                        <AreaPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/areas/nuevo', 
                    element: (
                      <ProtectedRoute permiso="AREA_CREATE">
                        <AreaFormPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/areas/editar/:id', 
                    element: (
                      <ProtectedRoute permiso="AREA_UPDATE">
                        <AreaFormPage />
                      </ProtectedRoute>
                    ) 
                },
                // PUESTOS 
                { 
                    path: 'catalogos/puestos', 
                    element: (
                      <ProtectedRoute permiso="PUESTO_READ">
                        <PuestoPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/puestos/nuevo', 
                    element: (
                      <ProtectedRoute permiso="PUESTO_CREATE">
                        <PuestoFormPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/puestos/editar/:id', 
                    element: (
                      <ProtectedRoute permiso="PUESTO_UPDATE">
                        <PuestoFormPage />
                      </ProtectedRoute>
                    ) 
                },
                // MUNICIPIO
                { 
                    path: 'catalogos/municipios', 
                    element: (
                      <ProtectedRoute permiso="MUNICIPIO_READ">
                        <MunicipioPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/municipios/nuevo', 
                    element: (
                      <ProtectedRoute permiso="MUNICIPIO_CREATE">
                        <MunicipioFormPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/municipios/editar/:id', 
                    element: (
                      <ProtectedRoute permiso="MUNICIPIO_UPDATE">
                        <MunicipioFormPage />
                      </ProtectedRoute>
                    ) 
                },
                // LOCALIDADES (ZONAEJIDAL)
                { 
                    path: 'catalogos/localidades', 
                    element: (
                      <ProtectedRoute permiso="ZONAEJIDAL_READ">
                        <ZonaEjidalPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/localidades/nuevo', 
                    element: (
                      <ProtectedRoute permiso="ZONAEJIDAL_CREATE">
                        <ZonaEjidalFormPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/localidades/editar/:id', 
                    element: (
                      <ProtectedRoute permiso="ZONAEJIDAL_UPDATE">
                        <ZonaEjidalFormPage />
                      </ProtectedRoute>
                    ) 
                },
                // TIPOS SERVICIO
                { 
                    path: 'catalogos/servicios', 
                    element: (
                      <ProtectedRoute permiso="SERVICIO_READ">
                        <ServicioPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/servicios/nuevo', 
                    element: (
                      <ProtectedRoute permiso="SERVICIO_CREATE">
                        <ServicioFormPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/servicios/editar/:id', 
                    element: (
                      <ProtectedRoute permiso="SERVICIO_UPDATE">
                        <ServicioFormPage />
                      </ProtectedRoute>
                    ) 
                },
                // TIPOS SERVICIO
                { 
                    path: 'catalogos/tipos-servicio', 
                    element: (
                      <ProtectedRoute permiso="TIPOSERVICIO_READ">
                        <TipoServicioPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/tipos-servicio/nuevo', 
                    element: (
                      <ProtectedRoute permiso="TIPOSERVICIO_CREATE">
                        <TipoServicioFormPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/tipos-servicio/editar/:id', 
                    element: (
                      <ProtectedRoute permiso="TIPOSERVICIO_UPDATE">
                        <TipoServicioFormPage />
                      </ProtectedRoute>
                    ) 
                },
                // TIPOS TERRENO
                { 
                    path: 'catalogos/tipos-terreno', 
                    element: (
                      <ProtectedRoute permiso="TIPOTERRENO_READ">
                        <TipoTerrenoPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/tipos-terreno/nuevo', 
                    element: (
                      <ProtectedRoute permiso="TIPOTERRENO_CREATE">
                        <TipoTerrenoFormPage />
                      </ProtectedRoute>
                    ) 
                },
                { 
                    path: 'catalogos/tipos-terreno/editar/:id', 
                    element: (
                      <ProtectedRoute permiso="TIPOTERRENO_UPDATE">
                        <TipoTerrenoFormPage />
                      </ProtectedRoute>
                    ) 
                },
                // GASTOS
                {
                  path: 'gastos-fijos',
                  element: (
                    <ProtectedRoute permiso="GASTOFIJO_READ">
                      <GastosFijosPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'gastos-fijos/nuevo',
                  element: (
                    <ProtectedRoute permiso="GASTOFIJO_CREATE">
                      <GastoFijoFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'gastos-fijos/editar/:id',
                  element: (
                    <ProtectedRoute permiso="GASTOFIJO_UPDATE">
                      <GastoFijoFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'gastos-diarios',
                  element: (
                    <ProtectedRoute permiso="GASTODIARIO_READ">
                      <GastosDiariosPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'gastos-diarios/nuevo',
                  element: (
                    <ProtectedRoute permiso="GASTODIARIO_CREATE">
                      <GastoDiarioFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'gastos-diarios/editar/:id',
                  element: (
                    <ProtectedRoute permiso="GASTODIARIO_UPDATE">
                      <GastoDiarioFormPage />
                    </ProtectedRoute>
                  )
                },
                // NOMINA
                {
                  path: 'nomina',
                  element: (
                    <ProtectedRoute permiso="NOMINA_READ">
                      <NominaPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'nomina/nuevo',
                  element: (
                    <ProtectedRoute permiso="NOMINA_CREATE">
                      <NominaFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'nomina/editar/:id',
                  element: (
                    <ProtectedRoute permiso="NOMINA_UPDATE">
                      <NominaFormPage />
                    </ProtectedRoute>
                  )
                },
                // TRABAJADORES
                { 
                  path: 'trabajadores', 
                  element: (
                    <ProtectedRoute permiso="TRABAJADOR_READ">
                      <TrabajadoresPage/>
                    </ProtectedRoute>
                  )
                },
                { 
                  path: 'trabajadores/nuevo', 
                  element: (
                    <ProtectedRoute permiso="TRABAJADOR_CREATE">
                      <TrabajadorFormPage/>
                    </ProtectedRoute>
                  )
                },
                { 
                  path: 'trabajadores/editar/:id', 
                  element: (
                    <ProtectedRoute permiso="TRABAJADOR_UPDATE">
                      <TrabajadorFormPage/>
                    </ProtectedRoute>
                  )
                },
                // ADMIN
                { 
                  path: 'admin/usuarios',
                  element: (
                    <ProtectedRoute permiso="USUARIO_READ">
                      <UsuariosPage/>
                    </ProtectedRoute>
                  ) 
                },
                {
                  path: 'admin/usuarios/nuevo',
                  element: (
                    <ProtectedRoute permiso="USUARIO_CREATE">
                      <UsuarioFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'admin/usuarios/:id/editar',
                  element: (
                    <ProtectedRoute permiso="USUARIO_UPDATE">
                      <UsuarioFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'admin/roles',
                  element: (
                    <ProtectedRoute permiso="ROL_READ">
                      <RolesPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'admin/roles/nuevo',
                  element: (
                    <ProtectedRoute permiso="ROL_CREATE">
                      <RolFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'admin/roles/:id/editar',
                  element: (
                    <ProtectedRoute permiso="ROL_UPDATE">
                      <RolFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'ordenes',
                  element: (
                    <ProtectedRoute permiso="ORDEN_READ">
                      <OrdenesPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'ordenes/nuevo',
                  element: (
                    <ProtectedRoute permiso="ORDEN_CREATE">
                      <OrdenFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'ordenes/:id/editar',
                  element: (
                    <ProtectedRoute permiso="ORDEN_UPDATE">
                      <OrdenFormPage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'ordenes/:id',
                  element: (
                    <ProtectedRoute permiso="ORDEN_READ">
                      <OrdenDetallePage />
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'recibos/nuevo',
                  element: (
                    <ProtectedRoute permiso="RECIBO_CREATE">
                      <ReciboFormPage/>
                    </ProtectedRoute>
                  )
                },
                {
                  path: 'recibos/:id/editar',
                  element: (
                    <ProtectedRoute permiso="RECIBO_UPDATE">
                      <ReciboFormPage/>
                    </ProtectedRoute>
                  )
                },
                { path: '/reportes', 
                  element: (
                  <ProtectedRoute >
                    <ReportesPage />
                  </ProtectedRoute>
                  ) 
                },
          ]
        },
        {
            path: "*",
            element: <Navigate to="/" replace />,
        },
    ]);

  return <RouterProvider router={router} />;
};
