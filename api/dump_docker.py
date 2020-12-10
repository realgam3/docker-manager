import os
import json
import subprocess
from requests_unixsocket import Session

session = Session()


def download_file(url, file_path):
    res = session.get(url, stream=True)
    with open(file_path, 'wb') as f:
        for chunk in res.iter_content(chunk_size=1024):
            if not chunk:
                continue
            f.write(chunk)
        f.flush()


"""/info
/version
/containers/json
/containers/:id/json
/containers/:id/top
/containers/:id/logs
/containers/:id/changes
/containers/:id/export
/containers/:id/stats"""

docker_compose_up = subprocess.Popen(["docker-compose", "-f", "./docker-manager/docker-compose.yml", "up", "--build", "-d"])
docker_compose_up.communicate()

subprocess.call("rm -fr ./public/containers/*", shell=True)

docker_api = {
    "info": session.get('http+unix://%2Fvar%2Frun%2Fdocker.sock/info').json(),
    "version": session.get('http+unix://%2Fvar%2Frun%2Fdocker.sock/version').json(),
    "containers": {
        "json": session.get('http+unix://%2Fvar%2Frun%2Fdocker.sock/containers/json?all=1').json(),
    }
}
for container in docker_api['containers']['json']:
    id = container['Id']
    print(id)

    docker_api['containers'][id] = {}
    docker_api['containers'][id]['json'] = session.get(
        'http+unix://%2Fvar%2Frun%2Fdocker.sock/containers/{id}/json'.format(id=id)
    ).json()

    if docker_api['containers'][id]['json']['State']["Status"] == "running":
        docker_api['containers'][id]['top'] = session.get(
            'http+unix://%2Fvar%2Frun%2Fdocker.sock/containers/{id}/top'.format(id=id)
        ).json()

    docker_api['containers'][id]["logs"] = {}
    docker_api['containers'][id]['logs']["stdout"] = session.get(
        'http+unix://%2Fvar%2Frun%2Fdocker.sock/containers/{id}/logs?stdout=1'.format(id=id)
    ).text
    docker_api['containers'][id]['logs']["stderr"] = session.get(
        'http+unix://%2Fvar%2Frun%2Fdocker.sock/containers/{id}/logs?stderr=1'.format(id=id)
    ).text

    docker_api['containers'][id]['changes'] = session.get(
        'http+unix://%2Fvar%2Frun%2Fdocker.sock/containers/{id}/changes'.format(id=id)
    ).json()

    os.makedirs('./public/containers/{id}/'.format(id=id))
    download_file(
        'http+unix://%2Fvar%2Frun%2Fdocker.sock/containers/{id}/export'.format(id=id),
        './public/containers/{id}/export'.format(id=id)
    )

with open('config.json', 'w') as f:
    json.dump(docker_api, f)

docker_compose_down = subprocess.Popen(["docker-compose", "-f", "./docker-manager/docker-compose.yml", "down"])
docker_compose_down.communicate()

