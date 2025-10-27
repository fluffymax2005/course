import { deleteCookie } from "./cookie.js";

export {messageBoxShowFromLeft, messageBoxShowFromRight};

let MESSAGE_BOX_HEIGHT_OFFSET = 20; // начальный отступ
const TOAST_MARGIN = 10; // отступ между тостами
const activeToasts = new Map(); // храним активные тосты

window.quitSystem = function quitSystem() {       
    deleteCookie('token');
    deleteCookie('tokenExpireTime');

    setTimeout(() => {
        const authorizeItem = document.getElementById('authorizeItem');
        const registerItem = document.getElementById('registerItem');
        const quitItem = document.getElementById('quitItem');

        authorizeItem.style.display = 'block';
        registerItem.style.display = 'block';
        quitItem.style.display = 'none';
    }, 10);

    // Создаем элемент уведомления
    messageBoxShow('Выход из системы успешно выполнен', '#4CAF50', false, '100', 'translateY(-50px)');
}

async function messageBoxShowFromLeft(message, background_color, isUsingPixels, left_pos, transform, duration = 3000) {
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
        removeToast(toastId);
    }, duration);

    return toastId;
}

async function messageBoxShowFromRight(message, background_color, isUsingPixels, right_pos, transform, duration = 3000) {
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
        removeToast(toastId);
    }, duration);

    return toastId;
}

function removeToast(toastId) {
    const toastInfo = activeToasts.get(toastId);
    if (!toastInfo) return;

    const { element, height } = toastInfo;
    
    // Анимация исчезновения
    element.style.opacity = '0';
    element.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        // Удаляем из Map и пересчитываем позиции
        activeToasts.delete(toastId);
        recalculateToastPositions();
    }, 300);
}

function recalculateToastPositions() {
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