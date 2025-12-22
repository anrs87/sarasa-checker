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