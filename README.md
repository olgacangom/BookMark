# 📚 BookMark
**BookMark** es una plataforma web integral diseñada para fusionar la gestión de colecciones bibliográficas físicas y digitales con una interacción social activa y el fomento del comercio local. <br>
A diferencia de otras soluciones comerciales, BookMark incentiva la compra en librerías de barrio mediante un motor de geolocalización, enfrentándose a las grandes plataformas de distribución y apoyando la economía de proximidad.

---

## Índice

1. [Funcionalidades Principales](#1-funcionalidades-principales)
2. [Stack Técnico](#2-stack-técnico)
3. [Configuración del entorno](#3-configuración-del-entorno)
    - 3.1 [Requisitos previos](#31-requisitos-previos)
    - 3.2 [Instalación y preparación](#32-instalación-y-preparación)
    - 3.3 [Variables de Entorno](#33-variables-de-entorno)
4. [Ejecución en Desarrollo](#4-ejecución-en-desarrollo)
5. [Planificación (Sprints)](#5-planificación-sprints)


---

## 1. Funcionalidades Principales

- **Gestión Híbrida**: Control total de bibliotecas físicas y digitales con estados de lectura personalizados.

- **Escáner ISBN**: Alta automática de ejemplares mediante la cámara y la API de Google Books.

- **Impacto Local**: Mapa interactivo para localizar librerías físicas y apoyar el comercio de proximidad.

- **Comunidad y IA**: Clubes de lectura con control de spoilers, chat en tiempo real y análisis de sentimientos en reseñas mediante IA.

- **Sostenibilidad**: Marketplace de segunda mano para intercambio y módulo de donaciones benéficas.


## 2. Stack Técnico 
| Capa | Tecnologías | Descripción |
|---|---|---|
| **Frontend** | React, Vite, JavaScript + SWC | Interfaz ágil, responsiva y con refresco ultra-rápido en desarrollo. |
| **Backend** | NestJS | Arquitectura robusta, escalable y modular. |
| **Base de Datos** | PostgreSQL (Supabase) | Persistencia relacional avanzada y gestión en la nube. |
| **Infraestructura** | Render | Despliegue y hosting gestionado. |
| **Gestión** | GitHub & Clockify | Metodología ágil por Sprints y control riguroso de tiempos. |



## 3. Configuración del entorno
### 3.1 Requisitos previos

- **Node.js** (v18+) e **npm** instalado.
- **Git** para el control de versiones.
- Cuenta en **Supabase** para la base de datos PostgreSQL.

### 3.2 Instalación y preparación
| Título | Descripción | Comandos |
|---|---|---|
| **Clonar el Repositorio** | Obtener el proyecto localmente | `git clone https://github.com/olgacangom/BookMark.git` |
| **Navegar al Directorio Raíz** | Entrar a la carpeta principal del proyecto. | `cd BookMark` |
| **Instalar backend** | Instalar dependencias del servidor | `cd backend && npm install` |
| **Instalar frontend** | Instalar dependencias del cliente | `cd ../frontend && npm install` |

### 3.3 Variables de Entorno
- Crear un archivo `.env` en la carpeta `/backend` con la siguiente configuración:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
PORT=3000
```


## 4. Ejecución en Desarrollo
Para trabajar en el proyecto, abre dos terminales:
- **Servidor (Backend)**:
    ```bash
    cd backend
    npm run start:dev
    ```
- **Cliente (Frontend)**:
    ```bash
    cd frontend
    npm run dev
    ```

Acceso local: http://localhost:5173

## 5. Planificación (Sprints)
[x] **Sprint 1**: Core - Configuración de arquitectura, Auth y CRUD básico.

[ ] **Sprint 2**: Comunidad y Gamificación - Feed, seguidores y sistema de logros.

[ ] **Sprint 3**: Interacción - Chat, clubes de lectura y eventos.

[ ] **Sprint 4**: IA y Mapas - Geolocalización de librerías y chatbot de recomendaciones.


