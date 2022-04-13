import * as THREE from "three";

export abstract class Preset {
  public abstract get preset(): THREE.Group;

  public abstract get animate(): () => void;
}

export class StandardPreset implements Preset {
  private set = new THREE.Group();
  private orbitLight = this.getDirectionalLight();
  private lightAngle = 0;

  constructor() {
    this.addGrid();
    this.addLight();
    this.set.add(this.orbitLight);
    this.updateLightAngle();
  }

  public get preset() {
    return this.set;
  }

  public get animate() {
    return () => {
      this.updateLightAngle();
    };
  }

  private addGrid() {
    const grid = new THREE.GridHelper(50, 50);
    this.set.add(grid);
  }

  private getDirectionalLight() {
    const directional = new THREE.DirectionalLight();
    directional.castShadow = true;
    directional.lookAt(0, 0, 0);
    return directional;
  }

  private updateLightAngle() {
    this.lightAngle = (this.lightAngle + 0.01) % (2 * Math.PI);
    this.orbitLight.position.set(
      50 * Math.cos(this.lightAngle),
      25,
      50 * Math.sin(this.lightAngle)
    );
  }

  private addLight() {
    const ambient = new THREE.AmbientLight(undefined, 0.5);
    this.set.add(ambient);
  }
}
