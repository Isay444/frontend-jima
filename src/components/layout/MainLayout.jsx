import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos"; // <-- IMPORT AGREGADO
import { 
  BarChart2, Briefcase, ChevronDown, ChevronRight, ClipboardList, 
  DollarSign, FileText, Folder, LogOut, UserCheck, Users, Wallet,
  HardHat, Shield, ShieldCheck, FileBarChart
} from "lucide-react";
import { useState, useMemo } from "react"; // <-- useMemo AGREGADO
import { NavLink, useNavigate, Outlet } from "react-router-dom";

export const MainLayout = () => {
    const { logout, usuario } = useAuth();
    const { tienePermiso } = usePermisos(); // <-- HOOK AGREGADO
    const navigate = useNavigate();
    const [catalogosOpen, setCatalogosOpen] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);

    const isAdmin = usuario?.nombreRol === 'ADMINISTRADOR'; // <-- BANDERA PARA OCULTAR ADMIN

    // Submenú de Catálogos
    const catalogosSubItems = [
        { to: '/catalogos/areas', label: 'Áreas (Nómina)', permiso: 'AREA_READ' },
        { to: '/catalogos/puestos', label: 'Puestos (Nómina)', permiso: 'PUESTO_READ' },
        { to: '/catalogos/municipios', label: 'Municipios', permiso: 'MUNICIPIO_READ' },
        { to: '/catalogos/localidades', label: 'Localidades', permiso: 'ZONAEJIDAL_READ' },
        { to: '/catalogos/servicios', label: 'Servicios', permiso: 'SERVICIO_READ' },
        { to: '/catalogos/tipos-servicio', label: 'Tipos de Servicio', permiso: 'TIPOSERVICIO_READ' },
        { to: '/catalogos/subtipos-terreno', label: 'Terrenos', permiso: 'SUBTIPOTERRENO_READ' },
        { to: '/catalogos/tipos-terreno', label: 'Tipos de Terreno', permiso: 'TIPOTERRENO_READ' },
    ];

    const adminSubItems = [
        { to: '/admin/usuarios', label: 'Usuarios', icon: <UserCheck className="w-4 h-4" />, permiso: 'USUARIO_READ' },
        { to: '/admin/roles', label: 'Roles', icon: <ShieldCheck className="w-4 h-4" />, permiso: 'ROL_READ' } 
    ];

    // Ítems principales del menú (sin Catálogos)
    const menuItems = [
        { to: '/clientes', label: 'Clientes', icon: <Users className="w-5 h-5" />, permiso: 'CLIENTE_READ' },
        { to: '/ordenes', label: 'Órdenes', icon: <FileText className="w-5 h-5" />, permiso: 'ORDEN_READ' },
        { to: '/gastos-diarios', label: 'Gastos Diarios', icon: <DollarSign className="w-5 h-5" />, permiso: 'GASTODIARIO_READ' },
        { to: '/gastos-fijos', label: 'Gastos Fijos', icon: <Wallet className="w-5 h-5" />, permiso: 'GASTOFIJO_READ' },
        { to: '/nomina', label: 'Nómina', icon: <ClipboardList className="w-5 h-5" />, permiso: 'NOMINA_READ' },
        { to: '/trabajadores', label: 'Trabajadores', icon: <Briefcase className="w-5 h-5" />, permiso: 'TRABAJADOR_READ' },
        { to: '/ingenieros', label: 'Ingenieros', icon: <HardHat className="w-5 h-5" />, permiso: 'INGENIERO_READ' },
        { to: '/reportes', label: 'Reportes', icon: <BarChart2 className="w-5 h-5" />, permiso: null }, // reportes sin permiso específico
    ];

    // <-- FILTRADOS POR PERMISOS (useMemo evita recalcular en cada render) -->
    const visibleMenuItems = useMemo(() => 
        menuItems.filter(item => !item.permiso || tienePermiso(item.permiso)), 
    [tienePermiso]);

    const visibleCatalogosSubItems = useMemo(() => 
        catalogosSubItems.filter(sub => !sub.permiso || tienePermiso(sub.permiso)), 
    [tienePermiso]);

    const visibleAdminSubItems = useMemo(() => 
        adminSubItems.filter(sub => !sub.permiso || tienePermiso(sub.permiso)), 
    [tienePermiso]);


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen w-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-4 overflow-y-auto">
                <div>
                    <div className="mb-8 px-2">
                        <h1 className="text-xl font-bold text-white tracking-wide">
                            {usuario ? `Hola, ${usuario.nombre}` : 'Bienvenido a Ventas JIMA'}
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">Usuario - {usuario?.nombreRol || 'Operador'}</p>
                    </div>

                    <nav className="space-y-1">
                        {/* Menú principal filtrado */}
                        {visibleMenuItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive 
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }`
                                }
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        ))}

                        {/* Sección Catálogos: Solo se muestra si hay al menos un catálogo visible */}
                        {visibleCatalogosSubItems.length > 0 && (
                            <div>
                                <button
                                    onClick={() => setCatalogosOpen(!catalogosOpen)}
                                    className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Folder className="w-5 h-5" />
                                        <span>Catálogos</span>
                                    </div>
                                    {catalogosOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                                
                                {catalogosOpen && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {visibleCatalogosSubItems.map((sub) => (
                                            <NavLink
                                                key={sub.to}
                                                to={sub.to}
                                                className={({ isActive }) =>
                                                    `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                        isActive 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                    }`
                                                }
                                            >
                                                {sub.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Sección Administración: Solo se muestra si es ADMINISTRADOR */}
                        {isAdmin && (
                            <div>
                                <button
                                    onClick={() => setAdminOpen(!adminOpen)}
                                    className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5" />
                                        <span>Administración</span>
                                    </div>
                                    {adminOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>

                                {adminOpen && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {visibleAdminSubItems.map((sub) => (
                                            <NavLink
                                                key={sub.to}
                                                to={sub.to}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                        isActive 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                    }`
                                                }
                                            >
                                                {sub.icon} {/* <-- Ahora sí renderiza el icono */}
                                                <span>{sub.label}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                    </nav>
                </div>

                {/* Botón de Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </button>
            </aside>

            {/* Área de Contenido Principal */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 p-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};