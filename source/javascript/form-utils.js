// Текстовое содержимое кнопок форм при подтверждении действия:
// 1. Добавить набор.
// 2. Редактировать набор.
// 3. Удалить набор.
// 4. Восстановить набор.

import { TableAction } from "./table-utils.js";

export class TableFormConfirmButton {
    static EDIT_BUTTON_TEXT = 'Сохранить';
    static INSERT_BUTTON_TEXT = 'Добавить';
    static DELETE_BUTTON_TEXT = 'Удалить';
    static RECOVER_BUTTON_TEXT = 'Восстановить';

    static get Edit() {return this.EDIT_BUTTON_TEXT};
    static get Insert() {return this.INSERT_BUTTON_TEXT};
    static get Delete() {return this.DELETE_BUTTON_TEXT};
    static get Recover() {return this.RECOVER_BUTTON_TEXT;}

    static Text(action) {
        switch (action) {
            case TableAction.Edit: return this.Edit;
            case TableAction.Insert: return this.Insert;
            case TableAction.Delete: return this.Delete;
            case TableAction.Recover: return this.Recover;
        }
    }
}

// Текстовое содержимое заголовков форм при подтверждении действия:
// 1. Добавить набор.
// 2. Редактировать набор.
// 3. Удалить набор.
// 4. Восстановить набор.

export class TableFormConfirmHeader {
    static EDIT_FORM_HEADER = 'Редактировать';
    static INSERT_FORM_HEADER = 'Добавить';
    static DELETE_FORM_HEADER = 'Удалить';
    static RECOVER_FORM_HEADER = 'Восстановить';

    static get Edit() {return this.EDIT_FORM_HEADER};
    static get Insert() {return this.INSERT_FORM_HEADER};
    static get Delete() {return this.DELETE_FORM_HEADER};
    static get Recover() {return this.RECOVER_FORM_HEADER;}
    static Text(action) {
        switch (action) {
            case TableAction.Edit: return this.Edit;
            case TableAction.Insert: return this.Insert;
            case TableAction.Delete: return this.Delete;
            case TableAction.Recover: return this.Recover;
        }
    }
}

let MESSAGE_BOX_HEIGHT_OFFSET = 20; // начальный отступ
const TOAST_MARGIN = 10; // отступ между тостами
const activeToasts = new Map(); // храним активные тосты

export class MessageBox {

    static async ShowFromLeft(message, background_color, isUsingPixels, left_pos, transform, duration = 3000) {
        if (activeToasts.size >= 10)
            return;
        
        const toast = document.createElement('div');
        toast.textContent = message;
        const toastId = Date.now() + Math.random(); // уникальный ID

        const leftPos = isUsingPixels === true ? `${left_pos}px` : `${left_pos}%`;
        
        toast.style.cssText = `
            position: fixed;
            top: ${MESSAGE_BOX_HEIGHT_OFFSET}px;
            left: ${leftPos};
            background: ${background_color};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 16px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            opacity: 0;
            transform: ${transform};
            transition: all 0.5s ease-in-out;
            max-width: 500px;
            text-align: center;
        `;

        document.body.appendChild(toast);

        // Ждем пока элемент отрендерится
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const height = toast.offsetHeight;
        
        // Сохраняем информацию о тосте
        activeToasts.set(toastId, {
            element: toast,
            height: height,
            top: MESSAGE_BOX_HEIGHT_OFFSET
        });

        // Увеличиваем отступ для следующего тоста
        MESSAGE_BOX_HEIGHT_OFFSET += height + TOAST_MARGIN;

        // Анимация появления
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Автоматическое скрытие
        setTimeout(() => {
            this._removeToast(toastId);
        }, duration);

        return toastId;
    }

    static async messageBoxShowFromRight(message, background_color, isUsingPixels, right_pos, transform, duration = 3000) {
        if (activeToasts.size >= 10)
            return;
        
        const toast = document.createElement('div');
        toast.textContent = message;
        const toastId = Date.now() + Math.random(); // уникальный ID

        const rightPos = isUsingPixels === true ? `${right_pos}px` : `${right_pos}%`;
        
        toast.style.cssText = `
            position: fixed;
            top: ${MESSAGE_BOX_HEIGHT_OFFSET}px;
            right: ${rightPos};
            background: ${background_color};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 16px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            opacity: 0;
            transform: ${transform};
            transition: all 0.5s ease-in-out;
            max-width: 500px;
            text-align: center;
        `;

        document.body.appendChild(toast);

        // Ждем пока элемент отрендерится
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const height = toast.offsetHeight;
        
        // Сохраняем информацию о тосте
        activeToasts.set(toastId, {
            element: toast,
            height: height,
            top: MESSAGE_BOX_HEIGHT_OFFSET
        });

        // Увеличиваем отступ для следующего тоста
        MESSAGE_BOX_HEIGHT_OFFSET += height + TOAST_MARGIN;

        // Анимация появления
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Автоматическое скрытие
        setTimeout(() => {
            _removeToast(toastId);
        }, duration);

        return toastId;
    }

    static _removeToast(toastId) {
        const toastInfo = activeToasts.get(toastId);
        if (!toastInfo) return;

        const { element } = toastInfo;
        
        // Анимация исчезновения
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            // Удаляем из Map и пересчитываем позиции
            activeToasts.delete(toastId);
            this._recalculateToastPositions();
        }, 300);
    }

    static _recalculateToastPositions() {
        let currentOffset = 20;
        
        // Обновляем позиции всех активных тостов
        activeToasts.forEach((toastInfo, toastId) => {
            const { element, height } = toastInfo;
            
            // Плавно перемещаем тост на новую позицию
            element.style.transition = 'top 0.3s ease-in-out';
            element.style.top = `${currentOffset}px`;
            
            // Обновляем информацию о позиции
            toastInfo.top = currentOffset;
            
            // Увеличиваем отступ для следующего тоста
            currentOffset += height + TOAST_MARGIN;
        });
        
        // Обновляем глобальный offset
        MESSAGE_BOX_HEIGHT_OFFSET = currentOffset;
    }
}