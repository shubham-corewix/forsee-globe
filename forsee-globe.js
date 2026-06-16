class ForseeGlobe extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
  
      this.innerHTML = `
        <div id="globe-area">
          <canvas id="networkGlobe"></canvas>
        </div>
  
        <style>
          #globe-area:active {
            cursor: grabbing;
          }
  
          canvas {
            display: block;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
        </style>
      `;
  
      this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
        .then(() =>
          this.loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js")
        )
        .then(() => this.initGlobe());
    }
  
    loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
  
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  
    initGlobe() {
      const container = this.querySelector("#globe-area");
      const canvas = this.querySelector("#networkGlobe");
  
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";
  
      const scene = new THREE.Scene();
  
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
  
      camera.position.set(0, 0, 7);
  
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
      });
  
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
  
      controls.target.set(0.42, 0, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.04;
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.rotateSpeed = 0.75;
      controls.minDistance = 7;
      controls.maxDistance = 7;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.7;
      controls.update();
  
      let isHovering = false;
  
      container.addEventListener("mouseenter", function () {
        isHovering = true;
      });
  
      container.addEventListener("mouseleave", function () {
        isHovering = false;
      });
  
      const mainGroup = new THREE.Group();
      scene.add(mainGroup);
  
      const pulseDots = [];
  
      function createDotNetworkSphere(radius, pointCount, connectDistance, pointColor, lineColor, opacity, pointSize) {
        const sphereGroup = new THREE.Group();
        const points = [];
  
        for (let i = 0; i < pointCount; i++) {
          const phi = Math.acos(2 * Math.random() - 1);
          const theta = Math.random() * Math.PI * 2;
  
          points.push(
            new THREE.Vector3(
              radius * Math.sin(phi) * Math.cos(theta),
              radius * Math.sin(phi) * Math.sin(theta),
              radius * Math.cos(phi)
            )
          );
        }
  
        const dotGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
        const dotMaterial = new THREE.PointsMaterial({
          color: pointColor,
          size: pointSize,
          transparent: true,
          opacity: opacity,
          sizeAttenuation: true
        });
  
        sphereGroup.add(new THREE.Points(dotGeometry, dotMaterial));
  
        const linePositions = [];
        const connectedPairs = [];
  
        for (let i = 0; i < points.length; i++) {
          for (let j = i + 1; j < points.length; j++) {
            if (points[i].distanceTo(points[j]) < connectDistance) {
              linePositions.push(points[i].x, points[i].y, points[i].z);
              linePositions.push(points[j].x, points[j].y, points[j].z);
              connectedPairs.push([points[i], points[j]]);
            }
          }
        }
  
        const lineGeometry = new THREE.BufferGeometry();
  
        lineGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(linePositions, 3)
        );
  
        const lineMaterial = new THREE.LineBasicMaterial({
          color: lineColor,
          transparent: true,
          opacity: opacity * 0.4
        });
  
        sphereGroup.add(new THREE.LineSegments(lineGeometry, lineMaterial));
  
        for (let i = 0; i < Math.min(26, connectedPairs.length); i++) {
          const pair = connectedPairs[Math.floor(Math.random() * connectedPairs.length)];
  
          const pulseGeometry = new THREE.SphereGeometry(pointSize * 1.9, 8, 8);
  
          const pulseMaterial = new THREE.MeshBasicMaterial({
            color: pointColor,
            transparent: true,
            opacity: opacity * 0.95
          });
  
          const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
  
          pulse.userData = {
            start: pair[0],
            end: pair[1],
            progress: Math.random(),
            speed: 0.003 + Math.random() * 0.004
          };
  
          pulseDots.push(pulse);
          sphereGroup.add(pulse);
        }
  
        return sphereGroup;
      }
  
      const innerGlobe = createDotNetworkSphere(
        1.48,
        520,
        0.34,
        0xffffff,
        0xffffff,
        0.96,
        0.016
      );
  
      const middleLayer = createDotNetworkSphere(
        2.5,
        380,
        0.48,
        0x6fa8ff,
        0x6fa8ff,
        0.42,
        0.014
      );
  
      const outerLayer = createDotNetworkSphere(
        3.95,
        460,
        0.58,
        0x3855b8,
        0x3855b8,
        0.32,
        0.013
      );
  
      mainGroup.add(outerLayer);
      mainGroup.add(middleLayer);
      mainGroup.add(innerGlobe);
  
      mainGroup.position.x = 0.42;
  
      innerGlobe.rotation.x = 0.35;
      middleLayer.rotation.x = -0.22;
      outerLayer.rotation.x = 0.16;
  
      function animate() {
        requestAnimationFrame(animate);
  
        pulseDots.forEach(function (dot) {
          dot.userData.progress += dot.userData.speed;
  
          if (dot.userData.progress > 1) {
            dot.userData.progress = 0;
          }
  
          dot.position.lerpVectors(
            dot.userData.start,
            dot.userData.end,
            dot.userData.progress
          );
        });
  
        controls.autoRotate = !isHovering;
  
        if (!isHovering) {
          innerGlobe.rotation.y += 0.0014;
          middleLayer.rotation.y -= 0.0008;
          outerLayer.rotation.y += 0.00045;
  
          innerGlobe.rotation.z += 0.00022;
          middleLayer.rotation.z -= 0.00018;
        }
  
        controls.update();
        renderer.render(scene, camera);
      }
  
      animate();
  
      window.addEventListener("resize", function () {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      });
    }
  }
  
  customElements.define("forsee-globe", ForseeGlobe);