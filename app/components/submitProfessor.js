import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { TextField } from '@mui/material';
import { School } from '@mui/icons-material';
import { Bounce, toast } from 'react-toastify';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '1px solid #000',
    boxShadow: 24,
    p: 3,
};

export default function SubmitProfessor() {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [proffessorUrl, setProfessorUrl] = React.useState("");

    const handleSubmit = async () => {

        if (proffessorUrl === "") {
            toast.error('Please Enter URL', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Bounce,
            });
            return;
        }
        const toastId = toast.promise(
            new Promise(async (resolve, reject) => {
                try {
                    const response = await fetch('/api/scraper', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ url: proffessorUrl }),
                    })
                    if (!response.ok)
                        throw new Error(response.statusText);
                    const data = await response.json();
                    setProfessorUrl("");
                    handleClose();
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            }),
            {
                pending: 'Submitting...',
                success: 'Submitted Successfully',
                error: 'Please Enter Valid RateMyProfessor URL',
            }, {
            position: "top-center",
            theme: "dark",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            transition: Bounce,
        }
        )
    }

    return (
        <Box
            marginBottom={"10px"}
        >
            <Button onClick={handleOpen}>Submit Professor Link</Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Box sx={{
                        display: 'flex',
                        gap: '20px',
                    }}>
                        <TextField
                            size='small'
                            fullWidth
                            value={proffessorUrl}
                            onChange={(e) => setProfessorUrl(e.target.value)}
                            type="text"
                            label="Enter URL"
                            placeholder='ratemyprofessor url'
                        />
                        <Button
                            size="small"
                            onClick={handleSubmit}
                            endIcon={<School />}
                        >Submit</Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
}