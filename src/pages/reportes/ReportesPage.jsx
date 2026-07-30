import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileSpreadsheet, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { usePermisos } from '@/hooks/usePermisos';
import { triggerDownload } from '@/utils/downloadHelper';
import {
    getReporteVentas,
    getReporteIngresos,
    getReporteGastosDiarios,
    getReporteGastosFijos,
    getReporteNomina,
} from '@/api/reportesApi';

/**
 * Página de Reportes — permite descargar los 5 reportes Excel del sistema.
 * Cada tarjeta se oculta completamente si el usuario no tiene el permiso correspondiente.
 * Las tarjetas con rango de fechas validan que fechaFin >= fechaInicio.
 * La tarjeta de Gastos Fijos usa select de mes + input numérico de año.
 */
export default function ReportesPage() {
    const { tienePermiso } = usePermisos();

    // ── Fechas por defecto (inicio de mes → hoy) ──
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fechaDefaultInicio = inicioMes.toISOString().split('T')[0];
    const fechaDefaultFin = hoy.toISOString().split('T')[0];

    // ── Estado de loading por reporte ──
    const [loading, setLoading] = useState({
        ventas: false,
        ingresos: false,
        gastosDiarios: false,
        gastosFijos: false,
        nomina: false,
    });

    // ── Estado de error por reporte ──
    const [error, setError] = useState({
        ventas: '',
        ingresos: '',
        gastosDiarios: '',
        gastosFijos: '',
        nomina: '',
    });

    // ── Estado de fechas por reporte ──
    const [fechas, setFechas] = useState({
        ventas: { inicio: fechaDefaultInicio, fin: fechaDefaultFin },
        ingresos: { inicio: fechaDefaultInicio, fin: fechaDefaultFin },
        gastosDiarios: { inicio: fechaDefaultInicio, fin: fechaDefaultFin },
        nomina: { inicio: fechaDefaultInicio, fin: fechaDefaultFin },
    });

    // ── Estado de mes/año para Gastos Fijos ──
    const [gastosFijosFiltro, setGastosFijosFiltro] = useState({
        mes: String(hoy.getMonth() + 1),
        anio: String(hoy.getFullYear()),
    });

    // ── Helpers ──
    const setLoadingReporte = (reporte, valor) =>
        setLoading((prev) => ({ ...prev, [reporte]: valor }));

    const setErrorReporte = (reporte, mensaje) =>
        setError((prev) => ({ ...prev, [reporte]: mensaje }));

    const actualizarFecha = (reporte, campo, valor) =>
        setFechas((prev) => ({
            ...prev,
            [reporte]: { ...prev[reporte], [campo]: valor },
        }));

    const fechaEsValida = (inicio, fin) => inicio && fin && fin >= inicio;

    // ── Handlers de descarga ──
    const descargarVentas = async () => {
        const { inicio, fin } = fechas.ventas;
        setLoadingReporte('ventas', true);
        setErrorReporte('ventas', '');
        try {
            const response = await getReporteVentas(inicio, fin);
            const filename = `reporte_ventas_${inicio}_${fin}.xlsx`;
            triggerDownload(response.data, filename);
        } catch (err) {
            setErrorReporte('ventas', err.response?.data?.message || 'Error al descargar el reporte');
        } finally {
            setLoadingReporte('ventas', false);
        }
    };

    const descargarIngresos = async () => {
        const { inicio, fin } = fechas.ingresos;
        setLoadingReporte('ingresos', true);
        setErrorReporte('ingresos', '');
        try {
            const response = await getReporteIngresos(inicio, fin);
            const filename = `reporte_ingresos_${inicio}_${fin}.xlsx`;
            triggerDownload(response.data, filename);
        } catch (err) {
            setErrorReporte('ingresos', err.response?.data?.message || 'Error al descargar el reporte');
        } finally {
            setLoadingReporte('ingresos', false);
        }
    };

    const descargarGastosDiarios = async () => {
        const { inicio, fin } = fechas.gastosDiarios;
        setLoadingReporte('gastosDiarios', true);
        setErrorReporte('gastosDiarios', '');
        try {
            const response = await getReporteGastosDiarios(inicio, fin);
            const filename = `reporte_gastos_diarios_${inicio}_${fin}.xlsx`;
            triggerDownload(response.data, filename);
        } catch (err) {
            setErrorReporte('gastosDiarios', err.response?.data?.message || 'Error al descargar el reporte');
        } finally {
            setLoadingReporte('gastosDiarios', false);
        }
    };

    const descargarGastosFijos = async () => {
        const { mes, anio } = gastosFijosFiltro;
        setLoadingReporte('gastosFijos', true);
        setErrorReporte('gastosFijos', '');
        try {
            const response = await getReporteGastosFijos(Number(mes), Number(anio));
            const filename = `reporte_gastos_fijos_${mes}_${anio}.xlsx`;
            triggerDownload(response.data, filename);
        } catch (err) {
            setErrorReporte('gastosFijos', err.response?.data?.message || 'Error al descargar el reporte');
        } finally {
            setLoadingReporte('gastosFijos', false);
        }
    };

    const descargarNomina = async () => {
        const { inicio, fin } = fechas.nomina;
        setLoadingReporte('nomina', true);
        setErrorReporte('nomina', '');
        try {
            const response = await getReporteNomina(inicio, fin);
            const filename = `reporte_nomina_${inicio}_${fin}.xlsx`;
            triggerDownload(response.data, filename);
        } catch (err) {
            setErrorReporte('nomina', err.response?.data?.message || 'Error al descargar el reporte');
        } finally {
            setLoadingReporte('nomina', false);
        }
    };

    // ── Componente reutilizable: tarjeta con rango de fechas ──
    const TarjetaRangoFechas = ({ titulo, icono, permiso, reporteKey, color }) => {
        if (!tienePermiso(permiso)) return null;

        const { inicio, fin } = fechas[reporteKey];
        const habilitado = fechaEsValida(inicio, fin);

        const handlers = {
            ventas: descargarVentas,
            ingresos: descargarIngresos,
            gastosDiarios: descargarGastosDiarios,
            nomina: descargarNomina,
        };

        return (
            <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 border-t-4 border-blue-500 p-2">
                <CardHeader className="pb-5 ">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-3 ${color} shadow-sm`}>
                            {icono}
                        </div>
                        <CardTitle className="text-lg">{titulo}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor={`${reporteKey}-inicio`} className="text-xs">Fecha inicio</Label>
                            <Input
                                id={`${reporteKey}-inicio`}
                                type="date"
                                value={inicio}
                                onChange={(e) => actualizarFecha(reporteKey, 'inicio', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`${reporteKey}-fin`} className="text-xs">Fecha fin</Label>
                            <Input
                                id={`${reporteKey}-fin`}
                                type="date"
                                value={fin}
                                onChange={(e) => actualizarFecha(reporteKey, 'fin', e.target.value)}
                            />
                        </div>
                    </div>
                    {error[reporteKey] && (
                        <p className="text-xs text-red-600">{error[reporteKey]}</p>
                    )}
                    <div className="mt-auto">
                        <Button
                            onClick={handlers[reporteKey]}
                            disabled={!habilitado || loading[reporteKey]}
                            className="w-full"
                        >
                            {loading[reporteKey] ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Descargando...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar Excel
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // ── Componente: tarjeta de Gastos Fijos (mes + año) ──
    const TarjetaGastosFijos = () => {
        if (!tienePermiso('GASTOFIJO_READ')) return null;

        const { mes, anio } = gastosFijosFiltro;
        const habilitado = mes && anio && anio.length === 4;

        return (
            <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 border-t-4 border-blue-500 p-2">
                <CardHeader className="pb-5 ">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl p-3 bg-orange-100 text-orange-600 shadow-sm">
                            <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">Gastos Fijos</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="gf-mes" className="text-xs">Mes</Label>
                            <Select
                                value={mes}
                                onValueChange={(v) => setGastosFijosFiltro((prev) => ({ ...prev, mes: v }))}
                            >
                                <SelectTrigger id="gf-mes">
                                    <SelectValue placeholder="Mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Enero</SelectItem>
                                    <SelectItem value="2">Febrero</SelectItem>
                                    <SelectItem value="3">Marzo</SelectItem>
                                    <SelectItem value="4">Abril</SelectItem>
                                    <SelectItem value="5">Mayo</SelectItem>
                                    <SelectItem value="6">Junio</SelectItem>
                                    <SelectItem value="7">Julio</SelectItem>
                                    <SelectItem value="8">Agosto</SelectItem>
                                    <SelectItem value="9">Septiembre</SelectItem>
                                    <SelectItem value="10">Octubre</SelectItem>
                                    <SelectItem value="11">Noviembre</SelectItem>
                                    <SelectItem value="12">Diciembre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="gf-anio" className="text-xs">Año</Label>
                            <Input
                                id="gf-anio"
                                type="number"
                                min={2000}
                                max={2100}
                                value={anio}
                                onChange={(e) => setGastosFijosFiltro((prev) => ({ ...prev, anio: e.target.value }))}
                            />
                        </div>
                    </div>
                    {error.gastosFijos && (
                        <p className="text-xs text-red-600">{error.gastosFijos}</p>
                    )}
                    <div className="mt-auto">
                        <Button
                            onClick={descargarGastosFijos}
                            disabled={!habilitado || loading.gastosFijos}
                            className="w-full"
                        >
                            {loading.gastosFijos ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Descargando...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar Excel
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader titulo="Reportes" />

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <TarjetaRangoFechas
                    titulo="Ventas"
                    icono={<TrendingUp className="h-6 w-6" />}
                    permiso="ORDEN_READ"
                    reporteKey="ventas"
                    color="bg-blue-100 text-blue-600"
                />
                <TarjetaRangoFechas
                    titulo="Ingresos"
                    icono={<DollarSign className="h-6 w-6" />}
                    permiso="RECIBO_READ"
                    reporteKey="ingresos"
                    color="bg-green-100 text-green-600"
                />
                <TarjetaRangoFechas
                    titulo="Gastos Diarios"
                    icono={<TrendingDown className="h-6 w-6" />}
                    permiso="GASTODIARIO_READ"
                    reporteKey="gastosDiarios"
                    color="bg-red-100 text-red-600"
                />
                <TarjetaGastosFijos />
                <TarjetaRangoFechas
                    titulo="Nómina"
                    icono={<Users className="h-6 w-6" />}
                    permiso="NOMINA_READ"
                    reporteKey="nomina"
                    color="bg-purple-100 text-purple-600"
                />
            </div>
        </div>
    );
}