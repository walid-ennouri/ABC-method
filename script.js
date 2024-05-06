var article_name=[];
var article_criteria=[];

// Select the button and the tableContainer
let button = document.getElementById('Generate-Table');
let tableContainer = document.getElementById('tableContainer');
let theChart1 = document.getElementById('the-first-chart');
let theChart2 = document.getElementById('the-second-chart');

// Initially hide the tableContainer
tableContainer.style.display = 'none';
theChart1.style.display = 'none';
theChart2.style.display = 'none';


// Add event listener to the button
button.addEventListener('click', function() {
    // Make the tableContainer visible
    tableContainer.style.display = 'block';
});

function generateTable(data = [[], []]) {
    var number_of_articles = parseInt(document.getElementById("Number-of-Article").value);
    var criteria_name = document.getElementById("Name-of-Criteria").value;
    var data1= data[0];
    var data2= data[1];
    var tableHTML = "<table class='table1'><tr><th>Article Name</th>";
    for (var i = 0; i < number_of_articles; i++) {
        var inputData1 = data1[i+1] ? data1[i+1] : ''; 
        tableHTML += "<td><input type='text' class='centered-input' id='article_name_" + i + "' value='" + inputData1 + "'></td>";
        // tableHTML += "<td><input type='text' class='centered-input' id='article_name_" + i + "' ></td>";
    }
    tableHTML += "</tr><tr><td>"+criteria_name+"</td>";
    for (var j = 0; j < number_of_articles; j++) {
        var inputData2 = data2[j+1] ? data2[j+1] : ''; 
        tableHTML += "<td><input type='number' class='centered-input' id='article_criteria_" + j + "' min='0' value='"+ inputData2 +"'></td>";
    }
    tableHTML += "</tr></table><br/>";

    // Add a calculate button to the table
    tableHTML += '<div id="fileInputContainer"><input type="file" id="fileInput"></div>';
    tableHTML += '<div id="buttonContainer"><button id="calculate">Calculate</button></div>';


    document.getElementById("tableContainer").innerHTML = tableHTML;
    document.getElementById('fileInput').addEventListener('change', handleFile);
    // Add an event listener to the calculate button
    document.getElementById("calculate").addEventListener("click", function() {
        theChart1.style.display = 'block';
        theChart2.style.display = 'block';
        article_name = [];
        article_criteria = [];
        for (var i = 0; i < number_of_articles; i++) {
            article_name.push(document.getElementById("article_name_" + i).value);
            article_criteria.push(parseFloat(document.getElementById("article_criteria_" + i).value));
        }

        var dic = abcMethod(number_of_articles, article_name, article_criteria, criteria_name);
        var dataset = {
            article_names: dic.articleNameSorted,
            pourcentage_criteria_cum: dic.pourcentage,
            pourcentage_rang: dic.pourcentageRang,
            criterie_value: dic.articleCriteriaSorted,
            classification: dic.classification,
            sums: dic.sums
        };
        generateCharts(dataset);
        // Generate the output table
        var outputTableHTML = "<table><tr><th>Article Name</th><th>"+criteria_name+"</th><th>"+criteria_name+" Cum</th><th>"+criteria_name+"%</th><th>Range</th><th>% Range</th><th>Classification</th></tr>";
        for (var j = 0; j < number_of_articles; j++) {
            outputTableHTML += "<tr><td>" + dic.articleNameSorted[j] + "</td><td>" + dic.articleCriteriaSorted[j] + "</td><td>" + dic.articleCriteriaCum[j] + "</td><td>" + dic.pourcentage[j].toFixed(2) + "</td><td>" + dic.rang[j] + "</td><td>" + dic.pourcentageRang[j].toFixed(2)+ "</td><td>" + dic.classification[j] + "</td></tr>";
        }
        var totalArticleCriteria = dic.articleCriteriaSorted.reduce(function(a, b) {
            return a + b;
        }, 0);
        
        var totalPourcentage = dic.pourcentage.reduce(function(a, b) {
            return a + b;
        }, 0);
        outputTableHTML += "<tr><td>Total</td><td>"+totalArticleCriteria+"</td><td></td><td>"+totalPourcentage.toFixed(2)+"</td><td></td></tr>";
        outputTableHTML += "</table><br/>";

        // Check if the outputTableContainer element exists
        var outputTableContainer = document.getElementById("outputTableContainer");
        if (outputTableContainer) {
            outputTableContainer.innerHTML = outputTableHTML;
        } else {
            console.error("outputTableContainer element not found");
        }
    });

}

document.addEventListener("DOMContentLoaded", function() {
    generateTable();

});


function abcMethod(numberOfArticles, articleName, articleCriteria, criteria_name) {
    let totalCriteria = articleCriteria.reduce((a, b) => a + b, 0);
    let sortIndices = articleCriteria.map((item, index) => [item, index]).sort((a, b) => b[0] - a[0]).map(item => item[1]);

    let articleNameSorted = sortIndices.map(i => articleName[i]);
    let articleCriteriaSorted = sortIndices.map(i => articleCriteria[i]);
    let articleCriteriaCum = articleCriteriaSorted.reduce((a, v, i) => [...a, v + (a[i-1] || 0)], []);
    let pourcentage = articleCriteriaCum.map(v => (v / totalCriteria) * 100);

    let rang = Array.from({length: numberOfArticles}, (_, i) => i + 1);
    let pourcentageRang = rang.map(i => (i / numberOfArticles) * 100);
    let pasRang = pourcentageRang[1] - pourcentageRang[0];

    let RD = (pourcentage.reduce((a, b) => a + b, 0) * pasRang - 5000) / 5000;

    let A, B, C;
    if (1 > RD && RD >= 0.9) {
        A = 0.1; B = 0.1; C = 0.8;
    } else if (0.9 > RD && RD >= 0.85) {
        A = 0.1; B = 0.2; C = 0.7;
    } else if (0.85 > RD && RD >= 0.78) {
        A = 0.2; B = 0.25; C = 0.55;
    } else if (0.75 > RD && RD >= 0.65) {
        A = 0.2; B = 0.3; C = 0.5;
    } else {
        window.alert('The criteria "' + criteria_name + '" are not sufficient to classify the articles because the RD = '+RD+' value is not in the range [0.65, 1] ');
    }

    let classification = [];
    let sums = {'A': 0, 'B': 0, 'C': 0};
    for (let i = 0; i < numberOfArticles; i++) {
        if (pourcentageRang[i] / 100 <= A) {
            classification.push('A');
            sums['A'] = pourcentage[i];
        } else if (pourcentageRang[i] / 100 <= A + B) {
            classification.push('B');
            sums['B'] = pourcentage[i] - sums['A'];
        } else {
            classification.push('C');
            sums['C'] = pourcentage[i] - (sums['B'] + sums['A']);
        }
    }

    // console.log('article name',articleNameSorted)
    return {
        classification: classification,
        articleNameSorted: articleNameSorted,
        articleCriteriaSorted: articleCriteriaSorted,
        articleCriteriaCum: articleCriteriaCum,
        pourcentage: pourcentage,
        rang: rang,
        pourcentageRang: pourcentageRang,
        sums: sums
    };
}


// document.addEventListener("DOMContentLoaded", function () {
//     // Dataset
//     var dataset = {
//         article_names: ['60', '30', '80', '40', '10', '50', '20', '100', '70', '90'],
//         pourcentage_criteria_cum: [36.92762186, 59.08419498, 73.85524372, 85.00738552, 90.32496307, 94.01772526, 97.11964549, 99.11373708, 99.63072378, 100],
//         pourcentage_rang: [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0],
//         criterie_value: [500, 300, 200, 151, 72, 50, 42, 27, 7, 5],
//         classification: ['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C', 'C'] // Add your actual classifications here
//     };

//     // Round pourcentage_criteria_cum to two decimal places
//     dataset.pourcentage_criteria_cum = dataset.pourcentage_criteria_cum.map(function(value) {
//         return parseFloat(value.toFixed(2));
//     });

//     // Map classifications to colors
//     var backgroundColors = dataset.classification.map(function(classification) {
//         switch (classification) {
//             case 'A':
//                 return "rgba(255, 0, 0, 0.6)"; // Red for A
//             case 'B':
//                 return "rgba(54, 162, 235, 0.6)"; // Blue for B
//             case 'C':
//                 return "rgba(255, 206, 86, 0.6)"; // Yellow for C
//             default:
//                 return "rgba(75, 192, 192, 0.6)"; // Green for others
//         }
//     });

//     var ctx = document.getElementById("abc-chart").getContext("2d");
//     var abcChart = new Chart(ctx, {
//         type: "bar",
//         data: {
//             labels: dataset.pourcentage_rang,
//             datasets: [{
//                 label: "Percentage Criteria Cumulative",
//                 data: dataset.pourcentage_criteria_cum,
//                 backgroundColor: backgroundColors,
//                 borderColor: "rgba(0, 0, 0, 1)",
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             scales: {
//                 xAxes: [{
//                     scaleLabel: {
//                         display: true,
//                         labelString: 'Percentage Rang'
//                     }
//                 }],
//                 yAxes: [{
//                     scaleLabel: {
//                         display: true,
//                         labelString: 'Percentage Criteria Cumulative'
//                     },
//                     ticks: {
//                         beginAtZero: true
//                     }
//                 }]
//             },
//             tooltips: {
//                 callbacks: {
//                     label: function(tooltipItem, data) {
//                         var articleName = dataset.article_names[tooltipItem.index];
//                         return articleName + ': ' + tooltipItem.yLabel;
//                     }
//                 }
//             }
//         }
//     });

//     document.getElementById('chartType').addEventListener('change', function() {
//         abcChart.config.type = this.value;
//         abcChart.update();
//     });

//     // The Chart number 2 : classification-chart
    
//     var sums = {
//         'A': 73.86,
//         'B': 20.14,
//         'C': 6
//     };

//     // Get labels and data from sums object
//     var labels = Object.keys(sums);
//     var data = Object.values(sums);

//     // Get canvas element
//     var ctx = document.getElementById('classification-chart').getContext('2d');

//     // Create chart
//     var myChart = new Chart(ctx, {
//         type: 'doughnut',
//         data: {
//             labels: labels,
//             datasets: [{
//                 data: data,
//                 backgroundColor: [
//                     'rgba(255, 99, 132, 0.5)',
//                     'rgba(54, 162, 235, 0.5)',
//                     'rgba(255, 206, 86, 0.5)',
//                 ],
//                 borderColor: [
//                     'rgba(255, 99, 132, 1)',
//                     'rgba(54, 162, 235, 1)',
//                     'rgba(255, 206, 86, 1)',
//                 ],
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             // Add options here if needed
//         }
//     });
    
// });


function generateCharts(dataset) {
    // Round pourcentage_criteria_cum to two decimal places
    dataset.pourcentage_criteria_cum = dataset.pourcentage_criteria_cum.map(function(value) {
        return parseFloat(value.toFixed(2));
    });

    dataset.pourcentage_rang = dataset.pourcentage_rang.map(function(value) {
        return parseFloat(value.toFixed(2));
    });
    // Map classifications to colors
    var backgroundColors = dataset.classification.map(function(classification) {
        switch (classification) {
            case 'A':
                return "rgba(255, 0, 0, 0.6)"; // Red for A
            case 'B':
                return "rgba(54, 162, 235, 0.6)"; // Blue for B
            case 'C':
                return "rgba(255, 206, 86, 0.6)"; // Yellow for C
            default:
                return "rgba(75, 192, 192, 0.6)"; // Green for others
        }
    });

    var ctx = document.getElementById("abc-chart").getContext("2d");
    var abcChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: dataset.pourcentage_rang,
            datasets: [{
                label: "Percentage Criteria Cumulative",
                data: dataset.pourcentage_criteria_cum,
                backgroundColor: backgroundColors,
                borderColor: "rgba(0, 0, 0, 1)",
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Percentage Rang'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Percentage Criteria Cumulative'
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        var articleName = dataset.article_names[tooltipItem.index];
                        return articleName + ': ' + tooltipItem.yLabel;
                    }
                }
            }
        }
    });

    document.getElementById('chartType').addEventListener('change', function() {
        abcChart.config.type = this.value;
        abcChart.update();
    });

    // The Chart number 2 : classification-chart

    var sums = dataset.sums;

    // Get labels and data from sums object
    var labels = Object.keys(sums);
    var data = Object.values(sums);

    // Get canvas element
    var ctx = document.getElementById('classification-chart').getContext('2d');

    // Create chart
    var myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            // Add options here if needed
        }
    });

    // Return the chart objects
    return [abcChart, myChart];

}


function handleFile(event) {
    // console.log("I am in handleFile")
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const tableData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        // console.log(tableData)
        generateTable(tableData);
    };

    reader.readAsArrayBuffer(file);
}