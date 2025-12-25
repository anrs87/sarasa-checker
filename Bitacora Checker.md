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

📅 Bitácora de Avance - Sarasa Checker (v1.0)
🔧 Backend & API (Optimización y Resiliencia)

Implementación de Estrategia "Cache-First": Se reescribió la lógica de api/check/route.ts para consultar primero la base de datos (Supabase) antes de llamar a la IA. Esto reduce costos y evita el error 429 (Too Many Requests) por saturación de cuota.



Manejo de Errores 429: Se agregó una captura específica para cuando la API de Google Gemini rechaza la conexión, devolviendo un mensaje amigable al usuario ("Se nos recalentó el mate") en lugar de fallar silenciosamente.

Normalización de URLs: Se añadió lógica para evitar duplicados en la base de datos (ej: tratar www.google.com y google.com como el mismo registro).

🏗️ Infraestructura y Dependencias

Resolución de Bloqueo de Espacio (ENOSPC): Se solucionó el error crítico de espacio en disco que impedía la instalación de paquetes.


Instalación del Stack Completo: Se integraron exitosamente las librerías @tavily/core (Búsqueda), @google/generative-ai (IA), @supabase/supabase-js (BD) y utilidades de UI (lucide-react, clsx, tailwind-merge).


🎨 Frontend & Experiencia de Usuario (Gamificación)

Componente ResultCard.tsx Definitivo: Se fusionó el diseño visual avanzado con la lógica de negocio. Incluye:


Badges de Acierto: Feedback visual según si el usuario adivinó o no ("¡Estás afilado!" vs "¡Te salvamos!").


Mensaje Diplomático: Tarjeta dedicada con botón de copiado rápido para "El Mensaje para la Tía" (WhatsApp).

Fuentes Clasificadas: Lista de evidencias con etiquetas visuales según el tipo de medio (Oficial, Medio, Social).

Implementación del "Prode de la Verdad": Se modificó page.tsx para incluir el Interaction Gap. Ahora el usuario debe votar ("Es Posta" vs "Es Verso") mientras la IA procesa, aumentando la retención y el aspecto lúdico.


El "Humómetro": Visualización de barra de progreso (0-100%) para indicar el nivel de falsedad de la noticia.

💅 Estilos y Configuración

Sistema de Diseño (Tailwind): Se configuró tailwind.config.ts con una paleta de colores semánticos personalizada (status-truth, status-fake, status-warning, status-satire) para mantener coherencia visual.

Utilidades: Creación de lib/utils.ts para el manejo dinámico de clases CSS.

✅ Estado Actual: El código está commiteado, las dependencias instaladas y la aplicación corre localmente con el flujo completo: Input -> Prode -> Análisis IA/Caché -> Resultado Gamificado.

📱 UX MOBILE & DATABASE SYNC (Ajuste Fino)
Mejoramos la legibilidad en celulares y ajustamos las tuercas del guardado de datos.

Frontend (Tarjetas de Alto Impacto):

Reemplazamos las tarjetas blancas lavadas de "Recién Salidos del Horno" por Tarjetas Semáforo.

Ahora usan un borde lateral de color (Verde/Rojo/Amarillo) para que el veredicto se entienda en un milisegundo al scrollear en el celular.

Reemplazamos la URL cruda por el Título Ganchero generado por la IA.

Backend (Sincronización de Memoria):

Fix en route.ts: La API se estaba olvidando de guardar el title en la base de datos. Ahora el insert incluye el título irónico para mostrarlo en la home.

Limpieza de Código: Se eliminaron "tags fantasmas" (referencias de citación) que se habían colado en el código y generaban ruido en el editor.

Base de Datos (Supabase):

Estandarización definitiva de columnas: verdict (texto), smoke_level (número) y title (texto).

✅ Estado: El historial ahora se ve "flama" en mobile y los datos se guardan completos.

🗓️ FASE 6: REFINAMIENTO, ESTRATEGIA Y DEPLOY (La Recta Final)
Estado: 🚀 EN PRODUCCIÓN (Online) URL: https://sarasa-checker.vercel.app

🔧 1. UX y Gamification Avanzada
Mejoramos la experiencia del usuario antes de recibir el veredicto para aumentar la retención y la "personalidad" de la app.

Prode Interactivo: Implementamos GuessOverlay.tsx. Ahora el usuario debe votar ("Posta", "Verso" o "Tibio") antes de ver el resultado.

Feedback Visual: Agregamos estados activos a los botones de votación y la opción "Tibio" (🐢) para los indecisos.

Manejo de Espera: Solucionamos el "limbo blanco" asegurando que el estado de carga (loading) se mantenga hasta que la interacción del usuario termine.

🧠 2. Lógica de Verificación y Fuentes (Backend)
Robustecimos el cerebro de la IA para dar respuestas más confiables y transparentes.

Jerarquía de Fuentes: Modificamos el SYSTEM_PROMPT en route.ts para que Gemini clasifique las fuentes en: OFICIAL, MEDIO, SOCIAL o DUDOSO.

Visualización de Credibilidad: Actualizamos ResultCard.tsx para mostrar "Badges" (etiquetas de colores) al lado de cada fuente, permitiendo al usuario distinguir rápidamente entre un paper científico y un tuit.

Validación de Input: Agregamos un filtro en el frontend para bloquear consultas menores a 10 caracteres, ahorrando costos de API.

🧱 3. El "Muro de la Verdad" y Persistencia
Para evitar que la app se sienta vacía y mejorar la retención sin fricción.

Historial Local (Sin Login): Implementamos localStorage para guardar silenciosamente las últimas búsquedas del usuario en su navegador.

Feed Comunitario: Creamos el componente RecentChecks.tsx que consulta a Supabase y muestra los últimos 3 chequeos realizados por la comunidad.

Seguridad de Cliente: Creamos lib/supabase-browser.ts para separar el cliente de administración (con llave secreta) del cliente público (con llave anónima), solucionando errores de seguridad en el frontend.

🎨 4. Identidad Visual y Social
Profesionalizamos la apariencia para compartir en redes.

Integración de Marca: Reemplazamos el título de texto por el logo oficial (logo.jpg) en el header.

Open Graph (WhatsApp): Configuramos layout.tsx con metadataBase y ubicamos opengraph-image.jpg (versión circular neón) en la carpeta app/ para asegurar que el link se vea atractivo al compartirse.

Dark Mode (Parcial): Ajustamos la estética para que los logos neón resalten sobre el fondo limpio.

☁️ 5. Infraestructura y Deploy
Llevamos el código de local a la nube.

Git & GitHub: Inicializamos el repositorio, configuramos un .gitignore estricto para proteger las API Keys y subimos el código.

Vercel: Conectamos el repositorio de GitHub con Vercel para CI/CD (Deploy automático al hacer push).

Variables de Entorno: Configuramos las llaves de producción (GOOGLE_API_KEY, SUPABASE, etc.) en el panel de Vercel.

📊 6. Analíticas
Confirmamos que no necesitamos herramientas externas.

Dashboard SQL: Creamos queries personalizadas en Supabase para medir: Total de chequeos, Veredictos (Verdad/Mentira) y el "Nivel de Humo Promedio" extrayendo datos directamente del JSON guardado por la IA.

Próximos Pasos Sugeridos (Post-Lanzamiento):

Monitorear el consumo de la API de Tavily/Gemini en Vercel/Supabase.

Recopilar feedback de los primeros usuarios (amigos/familia).

Evaluar si activar el "Modo Oscuro" nativo en toda la web para coincidir mejor con la estética Cyberpunk del logo.


📔 Bitácora de Desarrollo: Sarasa Checker
Fecha: 23 de Diciembre, 2025 Tema: Crisis de Cuota, Fantasmas de Cache y Arquitectura de Producto.

1. El Problema: "El Código Fantasma" y el Muro 429
Iniciamos la sesión con un error persistente: Quota exceeded (Error 429).

Síntoma: La terminal mostraba Consultando a Gemini 1.5... (log nuevo) pero Google respondía con errores del modelo 2.0 o Limit: 0.

Diagnóstico Técnico: Next.js mantenía versiones cacheadas del backend. Aunque cambiábamos el código, el servidor ejecutaba lógica vieja.

Acción Correctiva: Borrado manual y recurrente de la carpeta .next para forzar la recompilación real. Probamos modelos como gemini-1.5-flash-8b, gemini-2.0-flash-lite y gemini-2.0-flash estándar.

2. El Descubrimiento: "Morir de Éxito"
A pesar de crear API Keys nuevas y proyectos nuevos ("Checker Sarasa"), el error limit: 0 persistía.

La Causa Raíz: La aplicación estaba publicada en Vercel y tenía tráfico real de usuarios.

El Conflicto: El entorno de Producción (Vercel) y el de Desarrollo (Localhost) compartían la misma "manguera" (Proyecto de Google). Los usuarios agotaron la cuota diaria (Free Tier) dejando el tanque vacío para el desarrollo local.

Lección: Un proyecto en producción jamás debe compartir credenciales con el entorno de pruebas.

3. Diagnóstico de UX y Datos ("La Intuición")
Al analizar el comportamiento "chamánico" del sistema, detectamos fallas de diseño:

Esquizofrenia en UI: El Frontend mostraba un badge verde ("¡Estás afilado!") incluso cuando el Backend fallaba y devolvía un error manejado ("Google se quedó sin aire"). Mensaje contradictorio para el usuario.

Base de Datos Muda: La tabla request_logs tenía entradas (intentos), pero la tabla checks estaba vacía.

Razón: El código fallaba en la llamada a la API (Línea 80 aprox) y saltaba al catch, nunca llegando a la línea de inserción en checks. Estamos perdiendo data valiosa de fallos.

4. Estrategia de Escalabilidad e Inversión (Next Steps)
Para transformar el experimento en un producto robusto:

🛠️ Arquitectura
Segregación de Entornos:

Local: Proyecto Google "Sarasa-Dev" (Free Tier, exclusivo para mí).

Producción: Proyecto Google "Sarasa-Prod" (Blindado).

💰 Inversión Inteligente (Low Cost)
Plan: Migrar el proyecto de Producción a Google Cloud (Pay-as-you-go/Blaze).

Modelo: Usar Gemini 1.5 Flash.

Costo estimado: ~$0.075 USD / 1M tokens (baratísimo).

Seguridad Financiera: Configurar Budget Alerts en GCP con un tope duro (ej: USD $5/mes) que corte el servicio si se excede. Dormir tranquilo sin facturas sorpresa.

🧠 Calidad y Ética (Mitigación de Sesgos)
Temperatura: Bajar temperature a 0.2 o 0.3 en generationConfig para respuestas más fácticas y menos "creativas".

Grounding: Endurecer el Prompt para que obligatoriamente base el veredicto en las fuentes de Tavily y no en su conocimiento pre-entrenado.

5. Conclusión de la Sesión
Pasamos de intentar arreglar una línea de código a replantear la arquitectura del negocio. El problema no era el código, era la gestión de recursos compartidos en una app que empezó a tener tracción real.

📅 Bitácora de Avance - Sarasa Checker (Sesión de Emergencia & Evolución)
🚨 CRISIS Y SOLUCIÓN (El Problema de Gemini)
Situación: La app en producción comenzó a arrojar errores 429 ("Google se quedó sin aire") y 404, bloqueando el uso a los usuarios. Diagnóstico:

El modelo gemini-1.5-flash-latest fue deprecado o no encontrado por la librería.

Al actualizar a gemini-2.0-flash (estable), descubrimos que el límite gratuito es "0" para esa versión (requiere billing).

Se detectó que la librería @google/generative-ai estaba desactualizada.

🛠️ Implementación: "El Plan Hidra" (Multi-Modelo) Transformamos el backend (route.ts) para que no dependa de un solo proveedor.

Integración de Groq: Sumamos el modelo llama-3.3-70b-versatile (Open Source, rapidísimo) vía groq-sdk.

Enroque Táctico: Ante los fallos de Google, promovimos a Groq como motor TITULAR.

Sistema de Respaldo:

Titular: Groq (Llama 3.3).

Suplente: Gemini (Versión flash-latest o 2.0-flash-exp).

Último Recurso: Modo "Solo Evidencia" (Tavily), que entrega links sin análisis de IA si todo lo demás falla.

Limpieza de URLs: Mejoramos lib/utils.ts con una normalización agresiva (borrado de utm_source, etc.) para aumentar los aciertos de caché en Supabase.

🎨 MEJORAS DE UX/UI (La Cara Visible)
Share "Profesional": Reescribimos ResultCard.tsx. Ahora el botón "Copiar mensaje" genera un reporte completo con Emojis de Veredicto, Resumen, Link a la fuente y Link a la App.

Monetización Sutil: Agregamos los botones de Cafecito y Ko-fi directamente en el Home (page.tsx) con animaciones de entrada, para que estén visibles sin ser invasivos.

Footer: Actualizamos los créditos y links en layout.tsx.

🏰 DEFINICIÓN DE ARQUITECTURA: "PROTOCOLO FORTALEZA"
Para evitar saturaciones futuras y escalar a nivel "viral", dejamos delimitada la hoja de ruta técnica a implementar en la próxima sesión:

Fase 1 (Logística): Recolección de múltiples API Keys de Google (Pool de rotación) y Cohere (Mercenario extra).

Fase 2 (Memoria de Elefante): Activar pgvector en Supabase para búsqueda semántica (ahorro de IA en preguntas repetidas).

Fase 3 (Control de Tráfico): Implementación de Upstash QStash para encolar pedidos en momentos de pico.

Nueva Regla de Uso: Modificación del Rate Limit de "3 cada 3 horas" a "10 consultas por hora" (Ventana Deslizante).

✅ Estado Actual: La app es funcional, usa Groq como cerebro principal y tiene un fallback de seguridad. El error 404/429 desapareció de la vista del usuario.