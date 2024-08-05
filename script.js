let dataArray = [];

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
    const sortedData = distributeStudentsByPriority(dataArray);
    displayTables(sortedData);
});

// Функция для преобразования CSV в массив объектов
function csvToArray(csv) {
    const rows = csv.trim().split('\n');
    const headers = rows[0].split(';').map(header => header.replace(/"/g, '').trim());
    const data = rows.slice(1).map(row => {
        const values = row.split(';').map(value => value.replace(/"/g, '').trim());
        return {
            name: values[0],
            specialty: values[1],
            grade: parseFloat(values[2].replace(',', '.')),
            exam: values[3],
            priority: parseInt(values[4], 10),
            funding: values[5],
            form: values[6],
            provided: values[7]
        };
    });
    return data;
}

// Функция для распределения студентов по приоритетам
function distributeStudentsByPriority(data) {
    const maxPriority = 9;
    const specialtyTables = {};
    const addedStudents = new Set(); // Множество для хранения уникальных студентов

    const validSpecialties = [
        '39.02.01 Социальная работа',
        '43.02.16 Туризм и гостеприимство',
        '44.02.01 Дошкольное образование',
        '44.02.02 Преподавание в начальных классах',
        '44.02.03 Педагогика дополнительного образования',
        '44.02.04 Специальное дошкольное образование',
        '44.02.05 Коррекционная педагогика в начальном образовании',
        '49.02.01 Физическая культура',
        '49.02.02 Адаптивная физическая культура',
        '53.02.01 Музыкальное образование',
        '54.01.20 Графический дизайнер',
        '54.02.06 Изобразительное искусство и черчение'
    ];

    const validForms = ['Oчнo', 'Заочно'];
    const validFundings = ['Бюджет', 'Коммерция'];
    
    const specialtiesAllowingNoExam = [
        '39.02.01 Социальная работа',
        '43.02.16 Туризм и гостеприимство',
        '44.02.03 Педагогика дополнительного образования',
        '54.01.20 Графический дизайнер'
    ];

    data.forEach(student => {
        if (
            validSpecialties.includes(student.specialty) &&
            validForms.includes(student.form) &&
            validFundings.includes(student.funding) &&
            (student.exam === 'Да' || (specialtiesAllowingNoExam.includes(student.specialty) && student.exam === 'Нет'))
        ) {
            let added = false;
            for (let priority = 1; priority <= maxPriority; priority++) {
                if (student.priority === priority && !added) {
                    const specialtyKey = `${student.specialty}-${student.funding}-${student.form}`;

                    if (!specialtyTables[specialtyKey]) {
                        specialtyTables[specialtyKey] = [];
                    }

                    // Проверяем, добавлен ли студент, если нет, добавляем его
                    if (!addedStudents.has(student.name) && specialtyTables[specialtyKey].length < 50) {
                        student.priorityNumber = priority;
                        specialtyTables[specialtyKey].push(student);
                        addedStudents.add(student.name);
                        added = true;
                    }
                }
            }
        }
    });

    // Сортируем студентов по баллам в каждой специальности
    for (const key in specialtyTables) {
        specialtyTables[key].sort((a, b) => b.grade - a.grade);
    }

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
        ['Name', 'Specialty', 'Grade', 'Exam', 'Funding', 'Form', 'Provided', 'Priority Number'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        data[key].forEach(item => {
            const row = document.createElement('tr');
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
            priorityNumberCell.textContent = item.priorityNumber;
            row.appendChild(priorityNumberCell);

            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        outputDiv.appendChild(table);

        // Add student count and horizontal line
        const countDiv = document.createElement('div');
        countDiv.classList.add('student-count');
        countDiv.textContent = `Total students: ${data[key].length}`;
        outputDiv.appendChild(countDiv);

        const hr = document.createElement('hr');
        outputDiv.appendChild(hr);
    }
}
