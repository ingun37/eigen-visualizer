# Eigen vector visualizer

I made it for myself to grasp the concept of eigen vector and determinant.

It demonstrates eigen vectors preserving it's direction throughout the transformation by animating linear interpolation from identity matrix to transformation matrix. (I'm not advocating the idea of using linear-interpolation of matrix as a technique for general animation. Linear interpolating matrix here has no mathematical or technical meaning. It's an arbitrary choice for tweening between initial and transformed state.)

![](https://raw.githubusercontent.com/ingun37/eigen-visualizer/master/previews/sphere.gif)  
![](https://raw.githubusercontent.com/ingun37/eigen-visualizer/master/previews/urchin.gif)  
![](https://raw.githubusercontent.com/ingun37/eigen-visualizer/master/previews/cube.gif)  

---

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.0.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Setting up

Angular must be higher or equal to 9.0
