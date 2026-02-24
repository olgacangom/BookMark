# 🤝 Guía de Contribución para BookMark

Para mantener la calidad del código y la coherencia del historial durante los Sprints del desarrollo del proyecto, vamos a seguir estas directrices de flujo de trabajo.

## 🚀 Flujo de Trabajo (Workflow)

1. **Issue**: Cada tarea o funcionalidad debe estar vinculada a un Issue previo en GitHub (ej: `S1-01`).
2. **Branch**: Crea una rama específica desde `develop` siguiendo la convención de nombres.
3. **Desarrollo**: Realiza los cambios siguiendo los estándares de codificación de NestJS y React.
4. **Commit**: Registra tus avances usando la convención de **Conventional Commits**.
5. **Pull Request (PR)**: Envía los cambios a la rama `develop` mediante una PR detallada.

---

## 🌳 Estrategia de Ramas

Se utiliza una estructura basada en **Git Flow** adaptada a la gestión por Sprints e identificadores de tareas:

| Rama | Propósito | Ejemplo |
| :--- | :--- | :--- |
| `main` | Código estable y en producción (desplegado en Render). | `main` |
| `develop` | Rama principal de desarrollo e integración. | `develop` |
| **`feature/si-*`** | Nuevas funcionalidades según Sprint e ID de tarea. | **`feature/s1-01`** |
| `fix/*` | Correcciones de errores detectados. | `fix/login-bug` |
| `docs/*` | Cambios exclusivos en la documentación. | `docs/update-readme` |

---

## 📝 Convención de Commits

Es obligatorio que los mensajes de commit sigan el estándar de **Conventional Commits**:

* **`feat:`** Nueva funcionalidad (ej: `feat: add isbn scanner service`).
* **`fix:`** Corrección de un error.
* **`docs:`** Cambios en la documentación.
* **`style:`** Cambios de formato que no afectan al código.
* **`refactor:`** Mejora del código sin añadir funciones.
* **`chore:`** Mantenimiento (dependencias, `.gitignore`).

---

## 🛠️ Configuración Local Obligatoria

Para asegurar que el código cumple con los requisitos del TFG, se recomienda configurar los **hooks de Git**:

1. **Instalar pre-commit**:
   ```bash
   pip install pre-commit
   ```
2. **Activar validadores**:
    ```bash
    pre-commit install
    pre-commit install --hook-type commit-msg
   ```