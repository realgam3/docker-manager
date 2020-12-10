#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

const FLAG = fs.readFileSync("/app/flag").toString();

function createMap(screen, grid) {
    const map = grid.set(6, 0, 6, 6, contrib.map, {label: 'Servers Location'});
    let marker = true;
    setInterval(function () {
        if (marker) {
            map.addMarker({"lon": "-79.0000", "lat": "37.5000", color: 'yellow', char: 'X'});
            map.addMarker({"lon": "-122.6819", "lat": "45.5200"});
            map.addMarker({"lon": "-6.2597", "lat": "53.3478"});
            map.addMarker({"lon": "103.8000", "lat": "1.3000"});
        } else {
            map.clearMarkers();
        }
        marker = !marker;
        screen.render();
    }, 1000);

    return map;
}

function createProcessList(screen, grid) {
    const table = grid.set(6, 6, 6, 6, contrib.table, {
            keys: true,
            fg: 'green',
            label: 'Active Processes',
            columnSpacing: 1,
            columnWidth: [24, 10, 10]
        }
    );

    function generateTable() {
        const commands = ['grep', 'node', 'docker', 'ls', 'watchdog', 'npm', "python3", "cron"];

        let data = [];
        for (let i = 0; i < 30; i++) {
            let row = [];
            row.push(commands[Math.round(Math.random() * (commands.length - 1))]);
            row.push(Math.round(Math.random() * 5));
            row.push(Math.round(Math.random() * 100));

            data.push(row);
        }

        table.setData({headers: ['Process', 'Cpu (%)', 'Memory'], data: data});
    }

    generateTable();
    setInterval(generateTable, 3000);

    return table;
}

function createLogo(screen, grid) {
    return grid.set(0, 3, 8, 6, contrib.picture, {
            file: path.join(__dirname, 'docker.png'),
            align: "center",
            valign: "middle",
            onReady: () => {
                screen.render();
            }
        }
    );
}

function createFlag(screen, grid) {
    return grid.set(9, 3, 2, 6, blessed.box, {
            content: FLAG,
            align: "center",
            valign: "middle",
            hidden: true
        }
    );
}

function createPasswordInput(screen, grid, flag) {
    const password = grid.set(9, 3, 2, 6, blessed.textbox, {
            label: "Password",
            censor: true,
            mouse: true,
            inputOnFocus: true,
            align: "center",
            valign: "middle",
            border: {
                type: 'line',
		fg: 'white'
            },
            style: {
                focus: {
                    bg: 'white',
                    fg: 'black'
                }
            }
        }
    );

    password.on('submit', function (value) {
        if (value === "`IhviJ#~D]IgEAHY*hl-xH(2") {
            password.options.style.bg = "green";
            screen.render();
            setTimeout(function () {
                password.options.style.bg = "";
                password.hide();
                flag.show();
                screen.render();
            }, 2000);
        } else {
            password.options.style.bg = "red";
            password.setContent(value);
            screen.render();
            setTimeout(function () {
                password.options.style.bg = "";
                password.clearValue();
                password.focus();
            }, 2000);
        }
    });

    return password;
}

function main() {
    const screen = blessed.screen({smartCSR: true});
    const grid = new contrib.grid({rows: 12, cols: 12, screen: screen, hideBorder: true});

    const map = createMap(screen, grid);
    const ps = createProcessList(screen, grid);
    const flag = createFlag(screen, grid);
    const password = createPasswordInput(screen, grid, flag);
    const logo = createLogo(screen, grid);

    screen.on('resize', function () {
        map.emit('attach');
        ps.emit('attach');
        logo.emit('attach');
        password.emit('attach');
        flag.emit('attach');
    });

    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
        return process.exit(0);
    });

    screen.render();
    password.focus();
}

main();


