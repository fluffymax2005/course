import { isFieldRequired } from "./table-service.js";
import { TableAction, TableVariables } from "./table-utils.js";

// Словарь: имя секции на русском -> её название в коде

export class SectionName {
    static MAIN = ['Главная', 'main'];
    static DATABASE = ['База данных', 'database'];
    static STATISTICS = ['Статистика', 'statistics'];
    static ADMIN_PANEL = ['Панель администратора', 'admin-panel'];

    static getViewName(divSectionName) {
        const sections = Object.values(SectionName); // все поля данного класса

        // Находим нужное поле
        const foundSection = sections.find(section => Array.isArray(section) && section[1] === divSectionName);

        return foundSection ? foundSection[0] : null;
    }

    static getCodeName(sectionName) {
        const sections = Object.values(SectionName); // все поля данного класса

        // Находим нужное поле
        const foundSection = sections.find(section => Array.isArray(section) && section[0] === sectionName);

        return foundSection ? foundSection[1] : null;
    }
}

// Текстовое содержимое кнопок форм при подтверждении действия:
// 1. Добавить набор.
// 2. Редактировать набор.
// 3. Удалить набор.
// 4. Восстановить набор.

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
    static ANIMATION_PATH = '/workspace-form/assets/gifs/linux.gif';
    
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

    static async ShowFromRight(message, background_color, isUsingPixels, right_pos, transform, duration = 3000) {
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

    static async ShowFromCenter(message, background_color, duration = 3000) {
        if (activeToasts.size >= 10)
            return;
        
        const toast = document.createElement('div');
        toast.textContent = message;
        const toastId = Date.now() + Math.random(); // уникальный ID
        
        toast.style.cssText = `
            position: fixed;
            top: ${MESSAGE_BOX_HEIGHT_OFFSET}px;
            left: 50%;
            transform: translateX(-50%) translateY(50px);
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
            transition: all 0.5s ease-in-out;
            max-width: 600px;
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
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Автоматическое скрытие с кастомной анимацией для центрированного тоста
        setTimeout(() => {
            // Анимация исчезновения - перемещение вверх на 50px с затуханием
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-50px)';
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                
                // Удаляем из Map и пересчитываем позиции
                activeToasts.delete(toastId);
                this._recalculateToastPositions();
            }, 300);
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

    static ShowAwait() {
        if (document.getElementById('waitContainer')) {
            return;
        }
        
        const waitContainer = document.createElement('div');
        waitContainer.id = 'waitContainer';
        
        waitContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.05);
            display: flex;
            justify-content: center;
            align-items: flex-start;
            z-index: 100000;
        `;
        
        const animationContainer = document.createElement('div');
        animationContainer.className = 'animation-circle';
        
        const animation = document.createElement('img');
        animation.src = this.ANIMATION_PATH;
        animation.alt = 'Loading...';
        
        animationContainer.appendChild(animation);
        waitContainer.appendChild(animationContainer);
        document.body.appendChild(waitContainer);
        
        document.body.style.overflow = 'hidden';
        
        // Плавное появление
        setTimeout(() => {
            animationContainer.style.opacity = '1';
            animationContainer.style.transform = 'translateY(0)';
        }, 10);
        
        return waitContainer;
    }

    static RemoveAwait() {
        const waitContainer = document.getElementById('waitContainer');
        
        if (waitContainer) {
            const animationContainer = waitContainer.querySelector('.animation-circle');
            if (animationContainer) {
                animationContainer.style.opacity = '0';
                animationContainer.style.transform = 'translateY(-20px)';
            }
            
            setTimeout(() => {
                if (waitContainer.parentNode) {
                    waitContainer.remove();
                }
                document.body.style.overflow = '';
            }, 300);
        }
    }
}

export class InputWithTips {
    static createIdDependentField(fieldName, value) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `edit_${fieldName}`;
        input.name = fieldName;
        input.value = value;
        input.required = isFieldRequired(fieldName);

        input.setAttribute('correct-value', value);
        input.setAttribute('valid', 'false');

        validateInput();

        // Добавляем базовые стили для лучшего UX
        input.style.width = '100%';
        input.style.padding = '12px 16px';
        input.style.border = '2px solid rgba(226, 232, 240, 1)';
        input.style.borderRadius = '8px';
        input.style.boxSizing = 'border-box';
        input.style.fontSize = '14px';
        input.style.background = 'white';
        input.style.transition = 'all 0.3s ease';

        let currentDropdown = null;

        updateStyles();

        // Функция для получения подходящих элементов
        function getSimilarSets(inputValue) {
            if (!inputValue) return [];

            const similarSets = TableVariables.tableData.filter(item => {
                if (!item || item[fieldName] === undefined || item[fieldName] === null) 
                    return false;
                
                const itemValue = item[fieldName].toString().toLowerCase();
                return itemValue.includes(inputValue.toLowerCase());
            });

            return removeDuplicateObjects(similarSets, fieldName);
        }

        // Функция для жесткого получения элементов
        function getExactSets(inputValue) {
            if (!inputValue) return [];

            const exactSets = TableVariables.tableData.filter(item => inputValue === item[fieldName]);

            return removeDuplicateObjects(exactSets, fieldName);
        }

        // Удаление дубликатов в массиве
        function removeDuplicateObjects(array, key) {
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }

        // Функция проверки валидности значения
        function validateInput() {
            const inputValue = input.value.trim();
            const similarSets = getExactSets(inputValue);
            const isValid = similarSets.length > 0;
            
            input.setAttribute('valid', isValid.toString());
            return isValid;
        }

        // Функция обновления стилей на основе валидности
        function updateStyles() {
            const isValid = input.getAttribute('valid') === 'true';
            const hasFocus = document.activeElement === input;
            
            if (hasFocus) {
                // Стили при фокусе - показываем цвет валидации даже при фокусе
                input.style.outline = 'none';
                input.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                
                if (isValid) {
                    input.style.borderColor = 'green';
                } else {
                    input.style.borderColor = 'red';
                }
            } else {
                // Стили при потере фокуса
                input.style.boxShadow = '';
                if (isValid) {
                    input.style.borderColor = 'rgba(226, 232, 240, 1)';
                } else {
                    input.style.borderColor = 'red';
                }
            }
        }

        // Функция создания и отображения dropdown
        function showDropdown() {
            removeDropdown();

            const inputValue = input.value.trim();
            const similarSets = getSimilarSets(inputValue);

            // Обновляем валидность и стили ПЕРЕД созданием dropdown
            validateInput();
            updateStyles();

            // Создаем dropdown контейнер
            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown-list';
            dropdown.style.position = 'absolute';
            dropdown.style.zIndex = '10000';
            dropdown.style.background = 'white';
            dropdown.style.border = '1px solid #ccc';
            dropdown.style.borderTop = 'none';
            dropdown.style.maxHeight = '200px';
            dropdown.style.overflowY = 'auto';
            dropdown.style.width = '100%';
            dropdown.style.boxSizing = 'border-box';
            dropdown.style.borderRadius = '0 0 4px 4px';
            dropdown.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

            if (similarSets.length === 0 && inputValue !== '') {
                const noResults = document.createElement('div');
                noResults.textContent = 'Ничего не найдено';
                noResults.style.padding = '8px 12px';
                noResults.style.color = '#999';
                noResults.style.fontStyle = 'italic';
                dropdown.appendChild(noResults);
            } else if (similarSets.length > 0) {
                similarSets.forEach(set => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'dropdown-item';
                    itemElement.style.padding = '8px 12px';
                    itemElement.style.cursor = 'pointer';
                    itemElement.style.borderBottom = '1px solid #f0f0f0';
                    itemElement.style.transition = 'background-color 0.2s';

                    // Hover эффект
                    itemElement.addEventListener('mouseenter', function() {
                        this.style.background = '#f5f5f5';
                    });
                    itemElement.addEventListener('mouseleave', function() {
                        this.style.background = 'white';
                    });

                    // Обработка клика
                    itemElement.addEventListener('click', function() {
                        input.value = set[fieldName];
                        input.setAttribute('valid', 'true');
                        input.setAttribute('correct-value', set[fieldName]);
                        removeDropdown();
                        updateStyles();
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    });

                    // Формируем текст элемента
                    const itemText = document.createElement('span');
                    let displayText = set[fieldName];
                    if (set.name && fieldName !== 'name') {
                        displayText += ` - ${set.name}`;
                    }
                    itemText.textContent = displayText;
                    
                    itemElement.appendChild(itemText);
                    dropdown.appendChild(itemElement);
                });
            }

            // Позиционируем dropdown
            dropdown.style.top = '100%';
            dropdown.style.left = '0';

            // Добавляем dropdown в контейнер input'а
            if (input.parentNode) {
                input.parentNode.style.position = 'relative';
                input.parentNode.appendChild(dropdown);
                currentDropdown = dropdown;
                setupKeyboardNavigation(dropdown);
            }
        }

        // Функция удаления dropdown
        function removeDropdown() {
            if (currentDropdown && currentDropdown.parentNode) {
                currentDropdown.parentNode.removeChild(currentDropdown);
                currentDropdown = null;
            }
        }

        // Функция для навигации с клавиатуры
        function setupKeyboardNavigation(dropdown) {
            let currentIndex = -1;

            function setActiveItem(index) {
                const allItems = dropdown.querySelectorAll('.dropdown-item');
                allItems.forEach(item => {
                    item.style.background = 'white';
                    item.style.color = '';
                });
                
                if (index >= 0 && index < allItems.length) {
                    allItems[index].style.background = '#007bff';
                    allItems[index].style.color = 'white';
                    currentIndex = index;
                }
            }

            function handleKeyDown(e) {
                const items = dropdown.querySelectorAll('.dropdown-item');
                if (items.length === 0) return;

                switch(e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        currentIndex = (currentIndex + 1) % items.length;
                        setActiveItem(currentIndex);
                        break;
                        
                    case 'ArrowUp':
                        e.preventDefault();
                        currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                        setActiveItem(currentIndex);
                        break;
                        
                    case 'Enter':
                        e.preventDefault();
                        if (currentIndex >= 0 && currentIndex < items.length) {
                            items[currentIndex].click();
                        }
                        break;
                        
                    case 'Escape':
                        removeDropdown();
                        break;
                        
                    case 'Tab':
                        removeDropdown();
                        break;
                }
            }

            input.addEventListener('keydown', handleKeyDown);
        }

        // Обработчики событий
        input.addEventListener('focus', function() {
            input.setAttribute('correct-value', input.value);
            updateStyles();
            showDropdown();
        });

        input.addEventListener('input', function() {
            // При каждом вводе обновляем стили
            validateInput();
            updateStyles();
            showDropdown();
        });

        // Закрытие dropdown при потере фокуса
        input.addEventListener('blur', function() {
            // Сначала проверяем валидность
            validateInput();
            // Затем обновляем стили
            updateStyles();
            // И только потом закрываем dropdown
            setTimeout(removeDropdown, 150);
        });

        // Обработчик для закрытия при клике вне области
        document.addEventListener('click', function(e) {
            if (currentDropdown && !input.contains(e.target) && !currentDropdown.contains(e.target)) {
                removeDropdown();
                validateInput();
                updateStyles();
            }
        });

        return input;
    }
}