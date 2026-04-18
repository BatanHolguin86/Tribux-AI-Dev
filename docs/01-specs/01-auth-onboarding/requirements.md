# Requirements: Auth & Onboarding

**Feature:** 01 — Auth & Onboarding
**Fase IA DLC:** Phase 01 — Requirements & Spec
**Fecha:** 2026-03-05
**Status:** Pendiente aprobacion CEO/CPO

---

## User Stories

### Registro

- Como emprendedor digital, quiero registrarme con mi email y contrasena, para crear mi cuenta y empezar a construir mi primer proyecto.
- Como usuario, quiero registrarme con Google (OAuth), para no tener que crear otra contrasena y entrar mas rapido.
- Como usuario, quiero recibir un email de confirmacion al registrarme, para verificar que mi cuenta es valida y segura.

### Login

- Como usuario registrado, quiero iniciar sesion con email y contrasena, para acceder a mis proyectos.
- Como usuario registrado, quiero iniciar sesion con Google, para entrar rapido sin recordar contrasena.
- Como usuario, quiero poder recuperar mi contrasena via email, para no perder acceso a mi cuenta.

### Onboarding

- Como nuevo usuario, quiero un flujo de onboarding guiado despues de registrarme, para entender que es Tribux AI, como funciona la metodologia IA DLC y que puedo construir con la plataforma.
- Como nuevo usuario, quiero crear mi primer proyecto durante el onboarding (nombre, descripcion breve, industria), para llegar directo al valor sin pasos extra.
- Como nuevo usuario, quiero seleccionar mi perfil de usuario (Founder, PM, Consultor, Emprendedor digital), para que la plataforma personalice la experiencia y el lenguaje segun mi contexto.
- Como nuevo usuario, quiero ver un resumen de las 8 fases del IA DLC antes de empezar, para saber que recorrido me espera y sentirme orientado.

### Sesion & Seguridad

- Como usuario, quiero que mi sesion persista entre visitas, para no tener que hacer login cada vez que entro.
- Como usuario, quiero poder cerrar sesion de forma segura, para proteger mi cuenta en dispositivos compartidos.

---

## Acceptance Criteria

### Registro

- [ ] El usuario puede registrarse con email + contrasena (minimo 8 caracteres, al menos 1 numero)
- [ ] El usuario puede registrarse con Google OAuth en un solo click
- [ ] Al registrarse con email, se envia un correo de confirmacion automatico
- [ ] No se puede crear una cuenta con un email ya registrado (error claro y accionable)
- [ ] El formulario valida campos en tiempo real antes del submit

### Login

- [ ] El usuario puede iniciar sesion con email + contrasena correctos
- [ ] El usuario puede iniciar sesion con Google OAuth
- [ ] Credenciales incorrectas muestran mensaje de error sin revelar cual campo fallo (seguridad)
- [ ] El flujo de recuperacion de contrasena envia email con link valido por 1 hora
- [ ] La sesion persiste minimo 7 dias sin actividad (refresh token)

### Onboarding

- [ ] El onboarding se activa automaticamente en el primer login del usuario
- [ ] El flujo tiene maximo 4 pasos (no abrumar al usuario nuevo)
- [ ] El usuario selecciona su perfil: Founder, PM Senior, Consultor/Agency, Emprendedor Digital
- [ ] El usuario crea su primer proyecto con: nombre (requerido), descripcion breve (opcional), industria (selector)
- [ ] El usuario ve un resumen visual de las 8 fases del IA DLC antes de entrar al dashboard
- [ ] Al completar el onboarding, el usuario llega directo a su proyecto en Phase 00
- [ ] El onboarding puede omitirse (skip) pero queda accesible desde el menu de ayuda
- [ ] El progreso del onboarding se guarda si el usuario lo abandona a mitad

### Sesion & Seguridad

- [ ] Logout limpia la sesion del cliente y del servidor (invalida el token)
- [ ] Rutas protegidas redirigen a /login si el usuario no esta autenticado
- [ ] El estado de autenticacion es consistente entre tabs del mismo navegador

---

## Non-Functional Requirements

- **Performance:** La pagina de login/registro carga en menos de 1.5s (LCP)
- **Security:** Passwords hasheadas con bcrypt via Supabase Auth; nunca almacenadas en texto plano. Rate limiting en endpoints de auth (max 5 intentos fallidos por IP en 15 min)
- **Accessibility:** Formularios accesibles con labels, aria-attributes y navegacion por teclado. WCAG 2.1 nivel AA
- **Mobile:** Flujo completamente funcional en mobile (375px+); onboarding optimizado para touch
- **Email:** Emails de confirmacion y recuperacion se entregan en menos de 60 segundos

---

## Out of Scope

- Login con otros providers OAuth (GitHub, Microsoft, Apple) — v2
- 2FA / autenticacion de dos factores — v2
- SSO empresarial (SAML) — v3
- Invitar miembros al equipo / multi-user por proyecto — v2
- Perfil de usuario editable (avatar, nombre, bio) — v2
- Historial de sesiones activas — v2
