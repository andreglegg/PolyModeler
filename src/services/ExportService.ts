import * as THREE from 'three';

/**
 * Service for exporting 3D models to various formats
 * Currently supports OBJ format
 */
export class ExportService {
  /**
   * Export models to OBJ format
   */
  public static exportToOBJ(models: THREE.Mesh[]): string {
    let obj = '# PolyModeler Export\n\n';
    let vertexOffset = 1;

    models.forEach((model, i) => {
      obj += `o model_${i}\n`;

      const position = model.geometry.attributes.position;
      if (!position) return;

      const worldMatrix = model.matrixWorld;

      // Export vertices
      obj += this.exportVertices(position, worldMatrix);

      // Export faces
      const index = model.geometry.index;
      obj += this.exportFaces(position, index, vertexOffset);

      vertexOffset += position.count;
      obj += '\n';
    });

    return obj;
  }

  private static exportVertices(
    position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
    worldMatrix: THREE.Matrix4
  ): string {
    let vertices = '';

    for (let j = 0; j < position.count; j++) {
      const vertex = new THREE.Vector3(position.getX(j), position.getY(j), position.getZ(j));
      vertex.applyMatrix4(worldMatrix);
      vertices += `v ${vertex.x.toFixed(6)} ${vertex.y.toFixed(6)} ${vertex.z.toFixed(6)}\n`;
    }

    return vertices;
  }

  private static exportFaces(
    position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
    index: THREE.BufferAttribute | null,
    vertexOffset: number
  ): string {
    let faces = '';

    if (index) {
      for (let j = 0; j < index.count; j += 3) {
        const a = index.getX(j) + vertexOffset;
        const b = index.getX(j + 1) + vertexOffset;
        const c = index.getX(j + 2) + vertexOffset;
        faces += `f ${a} ${b} ${c}\n`;
      }
    } else {
      for (let j = 0; j < position.count; j += 3) {
        faces += `f ${j + vertexOffset} ${j + 1 + vertexOffset} ${j + 2 + vertexOffset}\n`;
      }
    }

    return faces;
  }

  /**
   * Download a file to the user's computer
   */
  public static downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export and download models as OBJ file
   */
  public static exportAndDownload(models: THREE.Mesh[], filename = 'model.obj'): void {
    const objContent = this.exportToOBJ(models);
    this.downloadFile(objContent, filename);
  }
}
