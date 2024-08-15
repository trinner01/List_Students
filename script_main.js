let dataArray = [];
let sortOrder = {};  // Для отслеживания порядка сортировки для каждой таблицы

// Приоритеты специальностей
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

        // Добавляем новый заголовок для номера
        const numberHeader = document.createElement('th');
        numberHeader.textContent = '№';
        headerRow.appendChild(numberHeader);

        // Остальные заголовки
        ['Name', 'Specialty', 'Grade', 'Exam', 'Funding', 'Form', 'Provided', 'Priority Number', 'Entrance Exam Result'].forEach((text, index) => {
            const th = document.createElement('th');
            th.textContent = text;
            if (text === 'Grade') {
                const arrowSpan = document.createElement('span');
                arrowSpan.classList.add('arrow');
                th.appendChild(arrowSpan);
                th.addEventListener('click', () => {
                    toggleSortOrder(data, key, index);
                });
            }
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        data[key].forEach((item, index) => {
            const row = document.createElement('tr');

            // Добавляем ячейку с номером
            const numberCell = document.createElement('td');
            numberCell.textContent = index + 1;
            row.appendChild(numberCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = item.name;
            row.appendChild(nameCell);

            const specialtyCell = document.createElement('td');
            specialtyCell.textContent = item.specialty;
            row.appendChild(specialtyCell);

            const gradeCell = document.createElement('td');
            gradeCell.textContent = item.grade.toFixed(2);
            row.appendChild(gradeCell);

            const examCell = document.createElement('td');
            examCell.textContent = item.exam;
            row.appendChild(examCell);

            const fundingCell = document.createElement('td');
            fundingCell.textContent = item.funding;
            row.appendChild(fundingCell);

            const formCell = document.createElement('td');
            formCell.textContent = item.form;
            row.appendChild(formCell);

            const providedCell = document.createElement('td');
            providedCell.textContent = item.provided;
            row.appendChild(providedCell);

            const priorityNumberCell = document.createElement('td');
            priorityNumberCell.textContent = item.priority;
            row.appendChild(priorityNumberCell);

            const entranceExamResultCell = document.createElement('td');
            entranceExamResultCell.textContent = item.entranceExamResult;
            row.appendChild(entranceExamResultCell);

            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        outputDiv.appendChild(table);

        // Добавление количества студентов и горизонтальной линии
        const countDiv = document.createElement('div');
        countDiv.textContent = `Количество студентов: ${data[key].length}`;
        outputDiv.appendChild(countDiv);
        outputDiv.appendChild(document.createElement('hr'));
    }
}

// Функция для переключения порядка сортировки и сортировки данных
function toggleSortOrder(data, specialtyKey, columnIndex) {
    const order = sortOrder[specialtyKey] || 'asc'; // По умолчанию порядок "asc"
    const newOrder = order === 'asc' ? 'desc' : 'asc';
    sortOrder[specialtyKey] = newOrder;

    // Сортировка данных в зависимости от выбранного столбца
    data[specialtyKey].sort((a, b) => {
        if (columnIndex === 2) { // Сортировка по столбцу "Grade"
            return newOrder === 'desc' ? b.grade - a.grade : a.grade - b.grade;
        }
    });

    // Перерисовка таблиц с новым порядком
    displayTables(data);
}

// Функция для скачивания таблиц в формате PDF
function downloadPDF() {
    const tables = document.querySelectorAll('table');
    const pdf = new jsPDF('p', 'pt', 'a4');

    tables.forEach((table, tableIndex) => {
        const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
            Array.from(tr.querySelectorAll('th, td')).map(td => td.innerText)
        );

        const pageHeight = pdf.internal.pageSize.height;

        pdf.autoTable({
            head: [rows[0]],
            body: rows.slice(1),
            startY: tableIndex === 0 ? 20 : pdf.lastAutoTable.finalY + 20,
            theme: 'grid',
            tableWidth: 'auto',
            margin: { top: 30 },
            styles: { fontSize: 8 },
            didDrawPage: function (data) {
                if (tableIndex === 0) {
                    pdf.text(`Specialty: ${table.querySelector('caption').innerText}`, 14, 10);
                }
                let str = 'Page ' + pdf.internal.getNumberOfPages();
                if (tableIndex !== tables.length - 1) {
                    str += ' of ' + tables.length;
                }
                pdf.text(str, pdf.internal.pageSize.width - 40, pdf.internal.pageSize.height - 30);
            }
        });

        if (pdf.lastAutoTable.finalY >= pageHeight - 20) {
            pdf.addPage();
        }
    });

    pdf.save('tables.pdf');
}
