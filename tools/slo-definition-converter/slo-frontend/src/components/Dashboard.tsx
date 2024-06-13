import React, {useState} from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  Button,
  TextareaAutosize,
  CircularProgress,
} from '@mui/material';

// OutputComponent: Displays the output text area, or an error message if parsing failed.
const OutputComponent: React.FC<{value: string; error: string | null}> = ({
  value,
  error,
}) => (
  <Paper elevation={3} style={{padding: '16px', marginBottom: '16px'}}>
    <Typography
      variant="subtitle1"
      gutterBottom
      style={{fontFamily: 'Google Sans, sans-serif'}}
    >
      Output
    </Typography>
    {error ? (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    ) : (
      <TextareaAutosize
        value={value}
        readOnly
        minRows={10}
        style={{
          width: '100%',
          resize: 'none',
          fontFamily: 'monospace',
          fontSize: '14px',
        }}
      />
    )}
  </Paper>
);

const Dashboard: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}`, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({jsonRaw: inputText}),
      });

      console.log(response);
      console.log(response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log(data.tfResult);
        setOutputText(data.tfResult);
      } else {
        const data = await response.json();
        setError('API request failed due to' + data.error);
      }
    } catch (err) {
      setError('An error occurred during the API request.' + err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* App Bar (Navigation Bar) */}
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h4"
            component="div"
            sx={{flexGrow: 1}}
            style={{fontFamily: 'Google Sans, sans-serif'}}
          >
            SLO Tools
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="md" style={{marginTop: '20px'}}>
        <Grid container spacing={3}>
          {/* Main Title */}
          <Grid item xs={12}>
            <Typography
              variant="h5"
              gutterBottom
              align="center"
              style={{fontFamily: 'Google Sans, sans-serif'}}
            >
              JSON Definition to TF Converter
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Paper
              elevation={3}
              style={{padding: '16px', marginBottom: '16px'}}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                style={{fontFamily: 'Google Sans, sans-serif'}}
              >
                Enter JSON
              </Typography>
              <TextareaAutosize
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                minRows={10}
                style={{
                  width: '100%',
                  resize: 'none',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                }}
              />
            </Paper>
          </Grid>
          <Grid
            item
            xs={12}
            style={{display: 'flex', justifyContent: 'center'}}
          >
            <Button
              variant="contained"
              onClick={handleConvert}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Convert'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <OutputComponent value={outputText} error={error} />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;
