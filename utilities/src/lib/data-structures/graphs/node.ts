export class Node {
    dependents: string[];
    dependencies: string[];
    identifiers: string[];
    constructor() {
        this.dependents = [];
        this.dependencies = [];
        this.identifiers = [];

    }
    addDependency(dependency: string) { }
}