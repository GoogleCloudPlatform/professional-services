# Modern CI/CD with Anthos: Demo Guide

## Overview

This guide walks you through putting together a [modern CI/CD reference architecture with Anthos](https://cloud.google.com/solutions/modern-ci-cd-with-anthos). There are different permutations to leverage anthos for your particular use case. The purpose of this guide is not to give you an ideal anthos CI/CD solution but to show you an example use case combining the different functionalities of Anthos and to demonstrate the benefits of using Anthos in your CI/CD process. In this guide, we’ll use [Gitlab](https://about.gitlab.com/) for source code management and CI/CD.

## Target Audience
*   Anthos newbie who has read about anthos from documentation and other tutorials and wants to get their hands dirty with some anthos work. 
*   Someone planning to set up a CI/CD pipeline with Anthos and trying to see how everything fits together.

## Labs
This tutorial assumes you have access to [Google Cloud Platform](https://cloud.google.com) and [Gitlab](https://gitlab.com/). Expert knowledge of Gitlab is not required but an understanding of the [basics](https://docs.gitlab.com/ee/gitlab-basics/) of Gitlab would help.

*   [Prerequisites](docs/1-prerequisites.md)
*   [Register GKE Clusters with Anthos](docs/2-register-gke-clusters-with-anthos.md)
*   [Set up Anthos Config Management (ACM)](docs/3-set-up-anthos-config-management.md)
*   [CICD with Anthos](docs/4-cicd-with-anthos-and-gitlab.md)
