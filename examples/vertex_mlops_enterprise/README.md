# ML Ops with Vertex AI for enterprises

Enterprises frequently have specific requirements, especially around security and scale, that are 
often not addressed by other examples. In this example we demonstrate machine learning use case implementation that respects typical security requirements, and that includes that automation to 
allow larger organizations achieve scale in terms of number of models.

## Contents of this example

We provide three notebooks to cover the three processes that we typically observe:

1. [01-experimentation.ipynb](01-experimentation.ipynb) covers the development process, where the features, the model and the training process are defined.
1. [02-cicd.ipynb](02-cicd.ipynb) covers the the CI/CD process that tests the code produced in the experimentation phase, and trains a production-ready model.
1. [03-prediction.ipynb](03-prediction.ipynb) cover the deployment process to make the model available, for example on a Vertex AI Endpoint or through Vertex AI Batch Prediction.

Each of the notebooks provides detailed instructions on prerequisites for their execution and they should be self-explanatory.


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## License

All solutions within this repository are provided under the
[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) license. Please see
the [LICENSE](/LICENSE) file for more detailed terms and conditions.

## Disclaimer

This repository and its contents are not an official Google Product.
