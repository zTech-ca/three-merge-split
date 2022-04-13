import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Preset, StandardPreset } from "./presets";

export class CanvasManager {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  private renderer = new THREE.WebGLRenderer();
  private controls = new OrbitControls(this.camera, this.renderer.domElement);
  private preset: Preset;

  constructor() {
    this.preset = new StandardPreset();
    this.designateIsPreset(this.preset.preset);
    this.scene.add(this.preset.preset);
    this.camera.position.set(0, 5, 5);
    this.renderer.setClearColor(0xf0f5f5);
    this.renderer.shadowMap.enabled = true;
    this.controls.update();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private animate() {
    requestAnimationFrame(this.animate);
    this.preset.animate();
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }

  private designateIsPreset(object: THREE.Object3D) {
    object.userData.isPreset = true;
  }

  private isPreset(object: THREE.Object3D) {
    return !!object.userData.isPreset;
  }

  public appendToDiv(div: HTMLDivElement) {
    this.fitToDiv(div);
    div.appendChild(this.renderer.domElement);
  }

  public removeFromDiv(div: HTMLDivElement) {
    div.removeChild(this.renderer.domElement);
  }

  public fitToDiv(div: HTMLDivElement) {
    const width = div.clientWidth;
    const height = div.clientHeight;
    const aspect = width / height;
    this.renderer.setSize(width, height);
    this.camera.aspect = aspect;
  }

  public add(object: THREE.Object3D) {
    this.scene.add(object);
  }

  public remove(object: THREE.Object3D) {
    this.scene.remove(object);
  }

  public clear() {
    this.scene.children
      .filter((object) => !this.isPreset(object))
      .forEach((object) => this.remove(object));
  }
}
