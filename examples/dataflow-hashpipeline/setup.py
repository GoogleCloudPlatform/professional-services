 import setuptools

 setuptools.setup(
    name='hashpipeline',
    version='0.1.0',
    install_requires=[
			"google-cloud-dlp==0.13.0",
			"google-cloud-secret-manager==0.2.0",
			"google-cloud-firestore==1.6.2"
		],
    packages=setuptools.find_packages(),
 )
