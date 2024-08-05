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
            exam: values[3]
        };
    });
    return data;
}

function sortDataBySpecialtyAndGrade(data) {
    const groupedData = data.reduce((acc, item) => {
        if (item.exam === 'Да') {
            if (!acc[item.specialty]) {
                acc[item.specialty] = [];
            }
            acc[item.specialty].push(item);
        }
        return acc;
    }, {});

    const sortedSpecialties = Object.keys(groupedData).sort();
    
    sortedSpecialties.forEach(specialty => {
        groupedData[specialty].sort((a, b) => b.grade - a.grade);
        groupedData[specialty] = groupedData[specialty].slice(0, 25);
    });

    return groupedData;
}

function displayTables(data) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';

    for (const specialty in data) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');
        ['Name', 'Specialty', 'Grade', 'Exam'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        data[specialty].forEach(item => {
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

            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        outputDiv.appendChild(table);
    }
}
