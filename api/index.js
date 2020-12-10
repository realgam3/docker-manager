const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require("body-parser");


var app = express();
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));

app.set('etag', false);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use((req, res, next) => {
    res.header('Api-Version', config["version"]["ApiVersion"]);
    res.header('Content-Type', 'application/stream');
    res.header('Docker-Experimental', 'false');
    res.header('Ostype', 'linux');
    res.header('Server', `Docker/${config["version"]["Version"]} (${config["version"]["Os"]})`);

    // Remove Node Headers
    res.removeHeader('X-Powered-By');

    next()
});
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false
}));
app.use((req, res, next) => {
    res.set('Content-Type', 'application/json');

    // Remove Node Headers
    res.removeHeader('Connection');

    next()
});

function isTrue(value) {
    if (value === undefined) {
        return false;
    }

    value = value.trim().toLowerCase();
    if (value.length < 1) {
        return false;
    }

    return ["false", "0"].indexOf(value) === -1;
}

function getFullId(id) {
    var containers = config['containers']['json'];
    for (let i in containers) {
        let idFull = containers[i]['Id'];
        if (idFull.startsWith(id)) {
            return idFull;
        }
    }
}

// Block Bad Requests
function block(req, res, next) {
    return res.status(400).json({"message": "Blocked By The Docker Application Firewall!"});
}

// CONTAINERS
app.get('/containers/json', (req, res, next) => {
    var query_all = isTrue(req.query.all);

    var containers = config['containers']['json'];
    if (!query_all) {
        containers = containers.filter(container => container['State'] === 'running');
    }

    res.json(containers);
});
app.post('/containers/create', block);
app.get('/containers/:id/json', (req, res, next) => {
    var id = getFullId(req.params.id);
    if (!id) {
        return res.status(404).json({"message": "No such container: " + req.params.id})
    }
    res.json(config['containers'][id]['json']);
});
app.get('/containers/:id/top', (req, res, next) => {
    var id = getFullId(req.params.id);
    if (!id) {
        return res.status(404).json({"message": "No such container: " + req.params.id})
    }
    if (config['containers'][id]['json']['State']['Status'] !== "running") {
        return res.status(409).json({"message": "Container " + id + " is not running"})
    }
    res.json(config['containers'][id]['top']);
});
app.get('/containers/:id/logs', (req, res, next) => {
    var id = getFullId(req.params.id);
    if (!id) {
        return res.status(404).json({"message": "No such container: " + req.params.id})
    }
    var stdout = isTrue(req.query.stdout);
    var stderr = isTrue(req.query.stderr);

    if (!stdout && !stderr) {
        return res.status(400).json({"message": "Bad parameters: you must choose at least one stream"});
    }

    res.set('Content-Type', 'text/plain');
    var resText = "";
    if (stdout) {
        resText += config['containers'][id]['logs']['stdout'];
    }
    if (stderr) {
        resText += config['containers'][id]['logs']['stderr'];
    }
    res.send(resText);
});
app.get('/containers/:id/changes', (req, res, next) => {
    var id = getFullId(req.params.id);
    if (!id) {
        return res.status(404).json({"message": "No such container: " + req.params.id})
    }
    res.json(config['containers'][id]['changes']);
});
app.get('/containers/:id/stats', block);
app.post('/containers/:id/resize', block);
app.post('/containers/:id/start', block);
app.post('/containers/:id/stop', block);
app.post('/containers/:id/restart', block);
app.post('/containers/:id/kill', block);
app.post('/containers/:id/update*', block);
app.post('/containers/:id/rename', block);
app.post('/containers/:id/pause', block);
app.post('/containers/:id/unpause', block);
app.post('/containers/:id/attach', block);
app.get('/containers/:id/attach/ws', block);
app.post('/containers/:id/wait', block);
app.delete('/containers/:id', block);
app.head('/containers/:id/archive', block);
app.get('/containers/:id/archive', block);
app.put('/containers/:id/archive', block);
app.post('/containers/prune', block);


// NETWORKS
app.get('/images/json', block);
app.post('/build', block);
app.post('/build/prune', block);
app.post('/images/create', block);
app.get('/images/:name/json', block);
app.get('/images/:name/history', block);
app.post('/images/:name/push', block);
app.post('/images/:name/tag', block);
app.delete('/images/:name', block);
app.get('/images/search', block);
app.post('/images/prune', block);
app.post('/commit', block);
app.get('/images/:name/get', block);
app.get('/images/get', block);
app.post('/images/load', block);


// NETWORKS
app.get('/networks', block);
app.get('/networks/:id', block);
app.delete('/networks/:id', block);
app.post('/networks/create', block);
app.post('/networks/:id/connect', block);
app.post('/networks/:id/disconnect', block);
app.post('/networks/prune', block);


// VOLUMES
app.get('/volumes', block);
app.post('/volumes/create', block);
app.get('/volumes/:name', block);
app.delete('/volumes/:name', block);
app.post('/volumes/prune', block);


// EXEC
app.post('/containers/:id/exec', block);
app.post('/exec/:id/start', block);
app.post('/exec/:id/resize', block);
app.get('/exec/:id/json', block);


// SWARM
app.get('/swarm', block);
app.post('/swarm/init', block);
app.post('/swarm/join', block);
app.post('/swarm/leave', block);
app.post('/swarm/update', block);
app.get('/swarm/unlockkey', block);
app.post('/swarm/unlock', block);


// NODES
app.get('/nodes', block);
app.post('/nodes/:id', block);
app.delete('/nodes/:id', block);
app.post('/nodes/:id/update', block);


// SERVICES
app.get('/services', block);
app.post('/services/create', block);
app.post('/services/:id', block);
app.delete('/services/:id', block);
app.post('/services/:id/update', block);
app.get('/services/:id/logs', block);


// TASKS
app.get('/tasks', block);
app.get('/tasks/:id', block);


// CONFIGS
app.get('/secrets', block);
app.post('/secrets/create', block);
app.get('/secrets/:id', block);
app.delete('/secrets/:id', block);
app.post('/secrets/:id/update', block);


// CONFIGS
app.get('/configs', block);
app.post('/configs/create', block);
app.get('/configs/:id', block);
app.delete('/configs/:id', block);
app.post('/configs/:id/update', block);


// PLUGINS
app.get('/plugins', block);
app.get('/plugins/privileges', block);
app.post('/plugins/pull', block);
app.get('/plugins/:name/json', block);
app.delete('/plugins/:name', block);
app.post('/plugins/:name/enable', block);
app.post('/plugins/:name/disable', block);
app.post('/plugins/:name/upgrade', block);
app.post('/plugins/create', block);
app.post('/plugins/:name/push', block);
app.post('/plugins/:name/set', block);


// SYSTEM
app.post('/auth', block);
app.get('/info', function (req, res, next) {
    res.json(config['info']);
});
app.get('/version', function (req, res, next) {
    res.json(config['version']);
});
app.get('/_ping', block);
app.get('/events', block);
app.get('/system/df', block);


// DISTRIBUTION
app.get('/distribution/:name/json', block);


// SESSION (EXPERIMENTAL)
app.get('/session', block);

// Default Error Page
app.all('/*', (req, res, next) => {
    return res.status(404).json({"message": "page not found"});
});

// Check if volume mounted
if (!fs.existsSync(path.join(__dirname, 'socket'))) {
    throw "Socket folder doesn't exist"
}

let socketPath = path.join(__dirname, 'socket/docker.sock');
fs.unlink(socketPath, function (err) {
    if (err) {
        console.error(err);
    }
    console.log('docker.sock has been Deleted');
    app.listen(socketPath, () => {
        fs.chmodSync(socketPath, 0777);
        console.log("app running");
    });
});
