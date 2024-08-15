let dataArray = [];
let sortOrder = {}; // Для отслеживания порядка сортировки для каждой таблицы

// Определение правил для окрашивания строк
const specialtyColorRules = {
    // Бюджет
    '44.02.01 Дошкольное образование': { form: 'Oчнo', funding: 'Бюджет', startIndex: 35+1 },
    '44.02.01 Дошкольное образование': { form: 'Заочно', funding: 'Бюджет', startIndex: 20+1 },
    // Коммерция
    '44.02.01 Дошкольное образование': { form: 'Oчнo', funding: 'Коммерция', startIndex: 15+1 },
    '44.02.02 Преподавание в начальных классах': { form: 'Oчнo', funding: 'Коммерция', startIndex: 5+1 },
    '44.02.04 Специальное дошкольное образования': { form: 'Oчнo', funding: 'Коммерция', startIndex: 5+1 },
    '44.02.05 Коррекционная педагогика в начальном образовании': { form: 'Oчнo', funding: 'Коммерция', startIndex: 5+1 },
    '44.02.03 Педагогика дополнительного образования': { form: 'Oчнo', funding: 'Коммерция', startIndex: 5+1 },
    '49.02.02 Адаптивная физическая культура': { form: 'Oчнo', funding: 'Коммерция', startIndex: 5+1 },
    '53.02.01 Музыкальное образование': { form: 'Oчнo', funding: 'Коммерция', startIndex: 5+1 },
    '54.02.06 Изобразительное искусство и черчение': { form: 'Oчнo', funding: 'Коммерция', startIndex: 5+1 },
    '44.02.01 Дошкольное образование': { form: 'Заочно', funding: 'Коммерция', startIndex: 5+1 },
    // Добавьте другие специальности и их правила
};

// Определение приоритетов специальностей
const specialtyPriorities = {
    '39.02.01 Социальная работа': 1,
    '43.02.16 Туризм и гостеприимство': 2,
    '44.02.01 Дошкольное образование': 3,
    '44.02.02 Преподавание в начальных классах': 4,
    '44.02.03 Педагогика дополнительного образования': 5,
    '44.02.04 Специальное дошкольное образование': 6,
    '44.02.05 Коррекционная педагогика в начальном образовании': 7,
    '49.02.01 Физическая культура': 8,
    '49.02.02 Адаптивная физическая культура': 9,
    '53.02.01 Музыкальное образование': 10,
    '54.01.20 Графический дизайнер': 11,
    '54.02.06 Изобразительное искусство и черчение': 12
};

// Специальности, для которых статус "Не предусмотрено"
const noExamSpecialties = [
    '43.02.16 Туризм и гостеприимство',
    '54.01.20 Графический дизайнер',
    '39.02.01 Социальная работа',
    '44.02.03 Педагогика дополнительного образования'
];

// Обработчик события для загрузки файла
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            dataArray = csvToArray(text);
        };
        reader.readAsText(file);
    }
});

// Обработчик события для показа таблиц
document.getElementById('showTablesButton').addEventListener('click', function() {
    const showOriginalsOnly = document.getElementById('originalsOnlyCheckbox').checked;
    const sortedData = distributeStudentsByAverageGrade(dataArray, showOriginalsOnly);
    displayTables(sortedData);
});

// Обработчик изменения состояния чекбокса
document.getElementById('originalsOnlyCheckbox').addEventListener('change', function() {
    const showOriginalsOnly = this.checked;
    const sortedData = distributeStudentsByAverageGrade(dataArray, showOriginalsOnly);
    displayTables(sortedData);
});

// Обработчик события для скачивания PDF
document.getElementById('downloadPDFButton').addEventListener('click', downloadPDF);

// Функция для преобразования CSV в массив объектов
function csvToArray(csv) {
    const rows = csv.trim().split('\n');
    const headers = rows[0].split(';').map(header => header.replace(/"/g, '').trim());
    const data = rows.slice(1).map(row => {
        const values = row.split(';').map(value => value.replace(/"/g, '').trim());
        const specialty = values[1];
        const entranceExamResult = noExamSpecialties.includes(specialty) ? 'Не предусмотрено' : values[8];

        return {
            name: values[0],
            specialty: specialty,
            grade: parseFloat(values[2].replace(',', '.')),
            exam: values[3],
            priority: parseInt(values[4], 10),
            funding: values[5],
            form: values[6],
            provided: values[7],
            entranceExamResult: entranceExamResult
        };
    });
    return data;
}

// Функция для распределения студентов по специальностям и формам обучения
function distributeStudentsByAverageGrade(data, showOriginalsOnly) {
    const specialtyTables = {};
    const studentPriorityMap = {}; // Для отслеживания приоритета, в который студент был добавлен

    const validSpecialties = Object.keys(specialtyPriorities);
    const validForms = ['Oчнo', 'Заочно'];
    const validFundings = ['Бюджет', 'Коммерция'];

    // Фильтрация студентов
    const students = data.filter(student =>
        validSpecialties.includes(student.specialty) &&
        validForms.includes(student.form) &&
        validFundings.includes(student.funding) &&
        student.entranceExamResult !== 'Неявка' &&
        student.entranceExamResult !== 'Незач' &&
        (student.exam === 'Да' || student.entranceExamResult === 'Зачет' || student.entranceExamResult === 'Не предусмотрено')
    ).sort((a, b) => b.grade - a.grade); // Сортировка по убыванию среднего балла

    // Белые ячейки: распределение студентов по их приоритетам
    students.forEach(student => {
        if (!showOriginalsOnly || student.provided === 'Оригинал') {
            const specialtyKey = `${student.specialty}-${student.funding}-${student.form}`;

            if (!specialtyTables[specialtyKey]) {
                specialtyTables[specialtyKey] = [];
            }

            if (!studentPriorityMap[student.name] ||
                specialtyPriorities[student.specialty] < specialtyPriorities[studentPriorityMap[student.name].specialty]) {

                if (studentPriorityMap[student.name]) {
                    // Удаление студента из предыдущей таблицы
                    const prevKey = studentPriorityMap[student.name].key;
                    specialtyTables[prevKey] = specialtyTables[prevKey].filter(s => s.name !== student.name);
                }

                specialtyTables[specialtyKey].push(student);
                studentPriorityMap[student.name] = { key: specialtyKey, specialty: student.specialty };
            }
        }
    });

    // Серые ячейки: добавление студентов в серые ячейки, если они не были добавлены в белую ячейку по этому приоритету
    students.forEach(student => {
        if (!studentPriorityMap[student.name] || studentPriorityMap[student.name].specialty !== student.specialty) {
            const specialtyKey = `${student.specialty}-${student.funding}-${student.form}`;

            if (!specialtyTables[specialtyKey]) {
                specialtyTables[specialtyKey] = [];
            }

            // Добавляем студента в серую ячейку
            specialtyTables[specialtyKey].push(student);
        }
    });

    return specialtyTables;
}

// Функция для отображения таблиц
function displayTables(data) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';

    for (const key in data) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');
        ['№', 'Удалить', 'Name', 'Specialty', 'Grade', 'Exam', 'Funding', 'Form', 'Provided', 'Priority Number', 'Entrance Exam Result'].forEach((text) => {
            const th = document.createElement('th');
            th.textContent = text;
            if (text === 'Grade') {
                const arrowSpan = document.createElement('span');
                arrowSpan.classList.add('arrow');
                th.appendChild(arrowSpan);
                th.addEventListener('click', () => {
                    toggleSortOrder(data, key, 4); // Column index for Grade is 4
                });
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        data[key].forEach((item, index) => {
            const row = document.createElement('tr');
            // Добавление данных в ячейки
            const cells = [
                index + 1, // №
                'Удалить', // Действие
                item.name,
                item.specialty,
                item.grade.toFixed(2),
                item.exam,
                item.funding,
                item.form,
                item.provided,
                item.priority,
                item.entranceExamResult
            ];

            cells.forEach((cellData, i) => {
                const cell = document.createElement('td');
                if (i === 1) {
                    // Создание кнопки "Удалить"
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = cellData;
                    deleteButton.addEventListener('click', () => {
                        removeStudent(data, key, item.name);
                    });
                    cell.appendChild(deleteButton);
                } else {
                    cell.textContent = cellData;
                }
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        outputDiv.appendChild(table);

        // Установка цвета строк после определенного номера
        setRowColors(tbody, specialtyColorRules, 26);
    }
}

// Функция для удаления студента
function removeStudent(data, specialtyKey, studentName) {
    if (data[specialtyKey]) {
        // Удаление студента из массива
        data[specialtyKey] = data[specialtyKey].filter(student => student.name !== studentName);

        // Если после удаления таблица пустая, удаляем ключ
        if (data[specialtyKey].length === 0) {
            delete data[specialtyKey];
        }

        // Перерисовываем таблицы
        displayTables(data);
    }
}

function setRowColors(tbody, specialtyColorRules, defaultStartIndex) {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach((row, index) => {
        const specialtyCell = row.cells[3].textContent;
        const formCell = row.cells[7].textContent;
        const fundingCell = row.cells[6].textContent;
        
        // Определяем startIndex на основе правила или используем значение по умолчанию
        const colorRule = Object.keys(specialtyColorRules).find(key =>
            specialtyCell.includes(key) &&
            (formCell === specialtyColorRules[key].form || !specialtyColorRules[key].form) &&
            (fundingCell === specialtyColorRules[key].funding || !specialtyColorRules[key].funding)
        );

        const startIndex = colorRule ? specialtyColorRules[colorRule].startIndex : defaultStartIndex;
        
        // Устанавливаем цвет фона
        if (index >= startIndex - 1) {
            row.style.backgroundColor = 'lightcoral'; // Красный цвет для серых ячеек
        }
    });
}

// Функция для переключения порядка сортировки и сортировки данных
function toggleSortOrder(data, specialtyKey, columnIndex) {
    const order = sortOrder[specialtyKey] || 'asc'; // По умолчанию порядок "asc"
    const newOrder = order === 'asc' ? 'desc' : 'asc';
    sortOrder[specialtyKey] = newOrder;

    // Сортировка данных в зависимости от выбранного столбца
    data[specialtyKey].sort((a, b) => {
        const aValue = Object.values(a)[columnIndex];
        const bValue = Object.values(b)[columnIndex];
        if (newOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Перерисовываем таблицы
    displayTables(data);
}

// Функция для скачивания PDF
function downloadPDF() {
    // Реализация для генерации и скачивания PDF
}
