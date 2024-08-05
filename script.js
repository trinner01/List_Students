let dataArray = [];

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

document.getElementById('showTablesButton').addEventListener('click', function() {
    const sortedData = sortDataBySpecialtyAndGrade(dataArray);
    displayTables(sortedData);
});

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
            priority: values[4],
            funding: values[5],
            form: values[6],
            provided: values[7] // Added new column
        };
    });
    return data;
}

function sortDataBySpecialtyAndGrade(data) {
    const groupedData = data.reduce((acc, item) => {
        if (item.exam === 'Да' && item.priority === '1') {
            if (!acc[item.specialty]) {
                acc[item.specialty] = {};
            }
            if (!acc[item.specialty][item.funding]) {
                acc[item.specialty][item.funding] = {};
            }
            if (!acc[item.specialty][item.funding][item.form]) {
                acc[item.specialty][item.funding][item.form] = [];
            }
            acc[item.specialty][item.funding][item.form].push(item);
        }
        return acc;
    }, {});

    for (const specialty in groupedData) {
        for (const funding in groupedData[specialty]) {
            for (const form in groupedData[specialty][funding]) {
                groupedData[specialty][funding][form].sort((a, b) => b.grade - a.grade);
                groupedData[specialty][funding][form] = groupedData[specialty][funding][form].slice(0, 50);
            }
        }
    }

    return groupedData;
}

function displayTables(data) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';

    for (const specialty in data) {
        for (const funding in data[specialty]) {
            for (const form in data[specialty][funding]) {
                const table = document.createElement('table');
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');

                const headerRow = document.createElement('tr');
                ['ФИО', 'Специальность', 'Средний балл', 'Экзамен', 'Финансирование', 'Форма обучения', 'Предоставлен'].forEach(text => {
                    const th = document.createElement('th');
                    th.textContent = text;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);

                data[specialty][funding][form].forEach(item => {
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
                    providedCell.textContent = item.provided; // New column
                    row.appendChild(providedCell);

                    tbody.appendChild(row);
                });

                table.appendChild(thead);
                table.appendChild(tbody);
                outputDiv.appendChild(table);

                // Add student count and horizontal line
                const countDiv = document.createElement('div');
                countDiv.classList.add('student-count');
                countDiv.textContent = `Total students: ${data[specialty][funding][form].length}`;
                outputDiv.appendChild(countDiv);

                const hr = document.createElement('hr');
                outputDiv.appendChild(hr);
            }
        }
    }
}
