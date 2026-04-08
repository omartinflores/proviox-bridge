namespace Snapcast {
    export class Host {
        constructor(json: any) {
            this.fromJson(json);
        }

        fromJson(json: any) {
            this.arch = json.arch;
            this.ip = json.ip;
            this.mac = json.mac;
            this.name = json.name;
            this.os = json.os;
        }

        arch: string = "";
        ip: string = "";
        mac: string = "";
        name: string = "";
        os: string = "";
    }

    export class Client {
        constructor(json: any) {
            this.fromJson(json);
        }

        fromJson(json: any) {
            this.id = json.id;
            this.host = new Host(json.host);
            const jsnapclient = json.snapclient;
            this.snapclient = { name: jsnapclient.name, protocolVersion: jsnapclient.protocolVersion, version: jsnapclient.version }
            const jconfig = json.config;
            this.config = { name: jconfig.name }
            this.connected = Boolean(json.connected);
        }

        id: string = "";
        host!: Host;
        snapclient!: {
            name: string;
            protocolVersion: number;
            version: string;
        }
        config!: {
            name: string;
        };
        connected: boolean = false;

        getName(): string {
            return this.config.name.length === 0 ? this.host.name : this.config.name;
        }
    }

    export class Server {
        constructor(json?: any) {
            if (json)
                this.fromJson(json);
        }

        fromJson(json: any) {
            this.groups = []
            for (const jgroup of json.groups) {
                const group = new Group();
                group.id = jgroup.id;
                for (const client of jgroup.clients)
                    group.clients.push(new Client(client));
                this.groups.push(group);
            }
        }

        groups: Group[] = [];

        getClient(id: string): Client | null {
            for (const group of this.groups) {
                const client = group.getClient(id);
                if (client)
                    return client;
            }
            return null;
        }

        getGroup(id: string): Group | null {
            for (const group of this.groups) {
                if (group.id === id)
                    return group;
            }
            return null;
        }
    }

    export class Group {
        id: string = "";
        clients: Client[] = [];

        getClient(id: string): Client | null {
            for (const client of this.clients) {
                if (client.id === id)
                    return client;
            }
            return null;
        }
    }
}

class SnapControl {
    constructor() {
        this.onConnectionChanged = null;
        this.server = new Snapcast.Server();
        this.msg_id = 0;
        this.status_req_id = -1;
        this.timer = null;
    }

    public connect(baseUrl: string) {
        this.disconnect();
        try {
            this.connection = new WebSocket(baseUrl + '/jsonrpc');
            this.connection.onmessage = (msg: MessageEvent) => this.onMessage(msg.data);
            this.connection.onopen = () => {
                this.status_req_id = this.sendRequest('Server.GetStatus');
                if (this.onConnectionChanged)
                    this.onConnectionChanged(this, true);
            };
            this.connection.onerror = (ev: Event) => { console.error('error:', ev); };
            this.connection.onclose = () => {
                if (this.onConnectionChanged)
                    this.onConnectionChanged(this, false, 'Connection lost, trying to reconnect.');
                console.info('connection lost, reconnecting in 1s');
                this.timer = setTimeout(() => this.connect(baseUrl), 1000);
            };
        } catch (e) {
            console.info('Exception while connecting: "' + e + '", reconnecting in 1s');
            if (this.onConnectionChanged)
                this.onConnectionChanged(this, false, 'Exception while connecting: "' + e + '", trying to reconnect.');
            this.timer = setTimeout(() => this.connect(baseUrl), 1000);
        }
    }

    public disconnect() {
        if (this.timer)
            clearTimeout(this.timer);
        if (this.connection) {
            this.connection.onclose = () => { };
            if (this.connection.readyState === WebSocket.OPEN) {
                this.connection.close();
            }
        }
        if (this.onConnectionChanged)
            this.onConnectionChanged(this, false);
    }

    onConnectionChanged: ((_this: SnapControl, _connected: boolean, _error?: string) => any) | null;

    private onNotification(notification: any): boolean {
        switch (notification.method) {
            case 'Client.OnNameChanged':
                this.getClient(notification.params.id).config.name = notification.params.name;
                return true;
            case 'Client.OnConnect':
            case 'Client.OnDisconnect':
                this.getClient(notification.params.client.id).fromJson(notification.params.client);
                return true;
            case 'Server.OnUpdate':
                this.server.fromJson(notification.params.server);
                return true;
            default:
                return false;
        }
    }

    public getClient(client_id: string): Snapcast.Client {
        const client = this.server.getClient(client_id);
        if (client == null) {
            throw new Error(`client ${client_id} was null`);
        }
        return client;
    }

    public setClientName(client_id: string, name: string) {
        const client = this.getClient(client_id);
        const current_name: string = (client.config.name !== "") ? client.config.name : client.host.name;
        if (name !== current_name) {
            this.sendRequest('Client.SetName', { id: client_id, name: name });
            client.config.name = name;
        }
    }

    private sendRequest(method: string, params?: any): number {
        const msg: any = {
            id: ++this.msg_id,
            jsonrpc: '2.0',
            method: method
        };
        if (params)
            msg.params = params;

        const msgJson = JSON.stringify(msg);
        console.debug("Sending: " + msgJson);
        this.connection.send(msgJson);
        return this.msg_id;
    }

    private onMessage(msg: string) {
        let refresh: boolean = false;
        const json_msg = JSON.parse(msg);
        const is_response: boolean = (json_msg.id !== undefined);
        
        if (is_response) {
            if (json_msg.id === this.status_req_id) {
                this.server = new Snapcast.Server(json_msg.result.server);
                refresh = true;
            }
        }
        else {
            if (Array.isArray(json_msg)) {
                for (const notification of json_msg) {
                    refresh = this.onNotification(notification) || refresh;
                }
            } else {
                refresh = this.onNotification(json_msg);
            }
            refresh = true;
        }
    }

    connection!: WebSocket;
    server: Snapcast.Server;
    msg_id: number;
    status_req_id: number;
    timer: ReturnType<typeof setTimeout> | null;
}

export { SnapControl }
export { Snapcast }
