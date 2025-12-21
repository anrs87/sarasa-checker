📔 BITÁCORA DEL PROYECTO: SARASA CHECKER
Alias: "El Avivador de Giles" Estado: MVP Listo para Deploy 🚀

🗓️ FASE 1: ADN Y FILOSOFÍA
Definimos que esto no es solo un verificador, es una herramienta con personalidad argentina.

Identidad: "Sarasa Checker". Tono coloquial, picante pero útil.

Monetización ("La Grieta del Bolsillo"): Abandonamos el botón genérico de "Donar".

Opción Popular: Cafecito ("Bancá la parada" - Pesos).

Opción VIP: Ko-fi ("¿Te sobraron verdes?" - Dólares).

Gamification: El usuario no recibe la data pasivamente. Tiene que jugar al "Prode" (Adivinar si es Posta o Verso) antes de ver la verdad.

🛠️ FASE 2: LOS CIMIENTOS (Infraestructura)
Levantamos las paredes del proyecto y resolvimos conflictos de versiones.

Tech Stack: Next.js 14/15, Tailwind CSS, Supabase (Base de datos), Google Gemini (IA), Tavily (Búsqueda).

Crisis de Tailwind: Tuvimos un conflicto con la versión 4 (beta). Hicimos downgrade a la versión 3.4 estable para recuperar el control de los estilos.

Configuración: Creamos el .env.local para proteger las llaves maestras (API Keys).

🧠 FASE 3: EL CEREBRO (Backend & Seguridad)
Programamos la lógica en app/api/check/route.ts.

Escudo Anti-Buitre (Rate Limiting):

Implementamos en Supabase una tabla request_logs y una función RPC.

Regla: Máximo 3 consultas cada 3 horas por IP.

Objetivo: Evitar que bots o usuarios intensos nos fundan la cuota de la API.

Bypass de Paywalls: Lógica inteligente que detecta si el input es URL o Texto. Si es texto, analiza el contenido directamente sin intentar scrapear (ideal para notas de Clarín/La Nación con candado).

Integración IA:

Conectamos Tavily para buscar evidencia en tiempo real.

Conectamos Gemini para analizar esa evidencia.

Fix Crítico: Solucionamos el error 404/429 de Google cambiando el modelo a gemini-flash-latest (el alias estable para cuentas gratuitas).

Corrección Next.js 15: Ajustamos la lectura de headers() que ahora es asincrónica (await headers()).

🎨 FASE 4: LA CARA (Frontend & UX)
Diseñamos la experiencia de usuario en page.tsx y componentes.

El Prode (GuessOverlay):

Implementamos un overlay que bloquea el resultado hasta que el usuario vota.

Agregamos la opción "Soy Tibio" (🐢) para los que no se animan a arriesgar.

Feedback visual al seleccionar opción antes de confirmar.

Tarjeta de Resultado (ResultCard):

Semáforo de colores según el veredicto (Verde=Verdad, Rojo=Mentira, Amarillo=Dudoso).

Barra de "Nivel de Humo".

Mensaje para la Tía: Generación de un texto diplomático listo para copiar y pegar en WhatsApp.

Manejo de Estados:

Arreglamos el bug del "Limbo" (pantalla blanca) asegurando que el loading visual se mantenga hasta la interacción del usuario.

Validación de Input: Bloqueamos búsquedas de menos de 10 caracteres para no gastar recursos en "hola".

💅 FASE 5: IDENTIDAD Y PULIDO FINAL
Le pusimos el traje de gala para salir a internet.

Assets Visuales:

Implementamos el logo "Cyberpunk" en la home.

Configuramos icon.jpg (Favicon) y opengraph-image.jpg (Banner social) en la carpeta public.

SEO: Configuramos metadatos en layout.tsx para que al compartir el link en WhatsApp se vea título, descripción y foto.

Legales: Agregamos un footer con Disclaimer ("Aviso Legal") aclarando que la IA puede pifiar y que esto es con fines de entretenimiento.

Limpieza: Configuramos VS Code para silenciar los errores molestos de CSS que no afectaban el funcionamiento.

🚦 ESTADO ACTUAL
Backend: ✅ Funcionando y seguro.

Frontend: ✅ Integrado, con logos y UX fluida.

Base de Datos: ✅ Registrando logs y chequeos.

Próximo Paso: Deploy a Vercel (Publicación real).