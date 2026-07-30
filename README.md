# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


```
ventas-frontend
├─ .env.development
├─ components.json
├─ eslint.config.js
├─ index.html
├─ jsconfig.json
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ favicon.svg
│  ├─ iconjima.svg
│  └─ icons.svg
├─ README.md
├─ src
│  ├─ api
│  │  ├─ areaApi.js
│  │  ├─ authApi.js
│  │  ├─ axiosInstance.js
│  │  ├─ clienteApi.js
│  │  ├─ gastoDiarioApi.js
│  │  ├─ gastoFijoApi.js
│  │  ├─ ingenieroApi.js
│  │  ├─ municipioApi.js
│  │  ├─ nominaApi.js
│  │  ├─ ordenApi.js
│  │  ├─ puestoApi.js
│  │  ├─ reciboApi.js
│  │  ├─ rolApi.js
│  │  ├─ servicioApi.js
│  │  ├─ subtipoTerrenoApi.js
│  │  ├─ tipoServicioApi.js
│  │  ├─ tipoTerrenoApi.js
│  │  ├─ trabajadorApi.js
│  │  ├─ usuarioApi.js
│  │  └─ zonaEjidalApi.js
│  ├─ App.css
│  ├─ App.jsx
│  ├─ components
│  │  ├─ layout
│  │  │  ├─ MainLayout.jsx
│  │  │  └─ ProtectedRoute.jsx
│  │  ├─ shared
│  │  │  ├─ CambiarPasswordDialog.jsx
│  │  │  ├─ ConfirmDialog.jsx
│  │  │  ├─ DarDeBajaDialog.jsx
│  │  │  ├─ PageHeader.jsx
│  │  │  └─ PermisosMatrix.jsx
│  │  └─ ui
│  │     ├─ alert.jsx
│  │     ├─ badge.jsx
│  │     ├─ button.jsx
│  │     ├─ card.jsx
│  │     ├─ checkbox.jsx
│  │     ├─ dialog.jsx
│  │     ├─ input.jsx
│  │     ├─ label.jsx
│  │     ├─ select.jsx
│  │     └─ table.jsx
│  ├─ context
│  │  └─ AuthContext.jsx
│  ├─ hooks
│  │  └─ usePermisos.jsx
│  ├─ index.css
│  ├─ lib
│  │  └─ utils.js
│  ├─ main.jsx
│  ├─ pages
│  │  ├─ admin
│  │  │  ├─ RolesPage.jsx
│  │  │  ├─ RolFormPage.jsx
│  │  │  ├─ UsuarioFormPage.jsx
│  │  │  └─ UsuariosPage.jsx
│  │  ├─ auth
│  │  │  └─ LoginPage.jsx
│  │  ├─ catalogos
│  │  │  ├─ AreaFormPage.jsx
│  │  │  ├─ AreaPage.jsx
│  │  │  ├─ MunicipioFormPage.jsx
│  │  │  ├─ MunicipioPage.jsx
│  │  │  ├─ PuestoFormPage.jsx
│  │  │  ├─ PuestoPage.jsx
│  │  │  ├─ ServicioFormPage.jsx
│  │  │  ├─ ServicioPage.jsx
│  │  │  ├─ SubtipoTerrenoFormPage.jsx
│  │  │  ├─ SubtipoTerrenoPage.jsx
│  │  │  ├─ TipoServicioFormPage.jsx
│  │  │  ├─ TipoServicioPage.jsx
│  │  │  ├─ TipoTerrenoFormPage.jsx
│  │  │  ├─ TipoTerrenoPage.jsx
│  │  │  ├─ ZonaEjidalForm.jsx
│  │  │  └─ ZonaEjidalPage.jsx
│  │  ├─ clientes
│  │  │  ├─ ClienteFormPage.jsx
│  │  │  └─ ClientePage.jsx
│  │  ├─ gastos
│  │  │  ├─ GastoDiarioFormPage.jsx
│  │  │  ├─ GastoFijoFormPage.jsx
│  │  │  ├─ GastosDiariosPage.jsx
│  │  │  └─ GastosFijosPage.jsx
│  │  ├─ ingenieros
│  │  │  ├─ IngenieroFormPage.jsx
│  │  │  └─ IngenieroPage.jsx
│  │  ├─ nomina
│  │  │  ├─ NominaFormPage.jsx
│  │  │  └─ NominaPage.jsx
│  │  ├─ ordenes
│  │  │  ├─ OrdenDetallePage.jsx
│  │  │  ├─ OrdenesPage.jsx
│  │  │  ├─ OrdenFormPage copy.jsx
│  │  │  └─ OrdenFormPage.jsx
│  │  ├─ recibos
│  │  │  └─ ReciboFormPage.jsx
│  │  └─ trabajadores
│  │     ├─ TrabajadoresPage.jsx
│  │     └─ TrabajadorFormPage.jsx
│  ├─ router
│  │  └─ AppRouter.jsx
│  └─ utils
│     ├─ constants.js
│     └─ formatters.js
├─ tailwind.config.js
└─ vite.config.js

```