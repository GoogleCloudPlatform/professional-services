from myPackage import somePython

def test_fahrToKelv():
    '''
    make sure freezing is calculated correctly
    '''

    
    assert somePython.fahrToKelv(32) == 273.15, 'incorrect freezing point!'
