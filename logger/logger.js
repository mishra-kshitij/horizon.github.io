document.addEventListener('DOMContentLoaded', () => {
    const userCallSignInput = document.getElementById('userCallSign');
    const gridSquareInput = document.getElementById('gridSquare');
    const callSignInput = document.getElementById('callSign');
    const frequencyInput = document.getElementById('frequency');
    const bandInput = document.getElementById('band');
    const modeSelect = document.getElementById('mode');
    const timeInput = document.getElementById('logTime');
    const addLogButton = document.getElementById('addLog');
    const saveLogButton = document.getElementById('saveLog');
    const loadFileInput = document.getElementById('loadFileInput');
    const loadLogButton = document.getElementById('loadLog');
    const logList = document.getElementById('logList');

    let logEntries = [];

    userCallSignInput.value = localStorage.getItem('userCallSign') || '';
    gridSquareInput.value = localStorage.getItem('gridSquare') || '';

    userCallSignInput.addEventListener('input', () => {
        localStorage.setItem('userCallSign', userCallSignInput.value.trim().toUpperCase());
    });
    gridSquareInput.addEventListener('input', () => {
        localStorage.setItem('gridSquare', gridSquareInput.value.trim().toUpperCase());
    });

    loadLogButton.addEventListener('click', () => {
        loadFileInput.click();
    });

    const convertLocalToUTC = (localDateTimeString) => {
        if (!localDateTimeString) return '';
        const date = new Date(localDateTimeString);
        return date.toISOString();
    };

    const convertUTCToLocalDateTime = (utcDateTimeString) => {
        if (!utcDateTimeString) return '';
        const date = new Date(utcDateTimeString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formatUTCForDisplay = (utcDateTimeString) => {
        if (!utcDateTimeString) return '';
        const date = new Date(utcDateTimeString);
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
    };

    const setInitialTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    setInitialTime();

    const getHamBand = (frequency) => {
        if (frequency >= 1.8 && frequency <= 2.0) return '160M';
        if (frequency >= 3.5 && frequency <= 4.0) return '80M';
        if (frequency >= 5.3 && frequency <= 5.45) return '60M';
        if (frequency >= 7.0 && frequency <= 7.3) return '40M';
        if (frequency >= 10.1 && frequency <= 10.15) return '30M';
        if (frequency >= 14.0 && frequency <= 14.35) return '20M';
        if (frequency >= 18.068 && frequency <= 18.168) return '17M';
        if (frequency >= 21.0 && frequency <= 21.45) return '15M';
        if (frequency >= 24.89 && frequency <= 24.99) return '12M';
        if (frequency >= 28.0 && frequency <= 29.7) return '10M';
        if (frequency >= 50.0 && frequency <= 54.0) return '6M';
        if (frequency >= 144.0 && frequency <= 148.0) return '2M';
        if (frequency >= 222.0 && frequency <= 225.0) return '1.25M';
        if (frequency >= 420.0 && frequency <= 450.0) return '70CM';
        if (frequency >= 902.0 && frequency <= 928.0) return '33CM';
        if (frequency >= 1240.0 && frequency <= 1300.0) return '23CM';
        return 'UNKNOWN';
    };

    frequencyInput.addEventListener('input', () => {
        const frequency = parseFloat(frequencyInput.value);
        bandInput.value = !isNaN(frequency) && frequency > 0 ? getHamBand(frequency) : '';
    });

    const renderLog = () => {
        logList.innerHTML = '';
        if (logEntries.length === 0) {
            const noEntryMessage = document.createElement('li');
            noEntryMessage.textContent = 'No log entries yet. Add one above!';
            noEntryMessage.style.textAlign = 'center';
            noEntryMessage.style.padding = '20px';
            noEntryMessage.style.color = '#a3b3c3';
            noEntryMessage.style.backgroundColor = 'transparent';
            noEntryMessage.style.boxShadow = 'none';
            noEntryMessage.style.border = 'none';
            logList.appendChild(noEntryMessage);
            return;
        }

        logEntries.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.setAttribute('data-index', index);
            listItem.innerHTML = `
                <div class="log-entry-info">
                    <span><strong>Contact Callsign:</strong> ${entry.callSign}</span>
                    <span><strong>Frequency:</strong> ${entry.frequency} MHz</span>
                    <span><strong>Band:</strong> ${entry.band}</span>
                    <span><strong>Mode:</strong> ${entry.mode}</span>
                    <span><strong>Time:</strong> ${formatUTCForDisplay(entry.time)}</span>
                </div>
                <div class="log-entry-actions">
                    <button class="edit-button">Edit</button>
                    <button class="delete-button">Delete</button>
                </div>
            `;
            logList.appendChild(listItem);
        });
    };

    renderLog();

    addLogButton.addEventListener('click', () => {
        const callSign = callSignInput.value.trim().toUpperCase();
        const frequency = parseFloat(frequencyInput.value);
        const band = bandInput.value.trim();
        const mode = modeSelect.value;
        const localTime = timeInput.value;

        if (callSign && !isNaN(frequency) && frequency > 0 && band && mode && localTime) {
            const utcTime = convertLocalToUTC(localTime);
            logEntries.push({ callSign, frequency, band, mode, time: utcTime });
            renderLog();
            callSignInput.value = '';
            setInitialTime();
        } else {
            alert('Please fill in all valid fields (Callsign, Frequency, Mode, Time).');
        }
    });

    logList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-button')) {
            const index = parseInt(e.target.closest('li').dataset.index);
            if (!isNaN(index)) {
                logEntries.splice(index, 1);
                renderLog();
            }
        } else if (e.target.classList.contains('edit-button')) {
            const listItem = e.target.closest('li');
            const index = parseInt(listItem.dataset.index);
            const entry = logEntries[index];

            if (listItem.classList.contains('editing')) {
                const editedCallSign = listItem.querySelector('.edit-callsign').value.trim().toUpperCase();
                const editedFrequency = parseFloat(listItem.querySelector('.edit-frequency').value);
                const editedMode = listItem.querySelector('.edit-mode').value;
                const editedLocalTime = listItem.querySelector('.edit-time').value;

                if (editedCallSign && !isNaN(editedFrequency) && editedFrequency > 0 && editedMode && editedLocalTime) {
                    entry.callSign = editedCallSign;
                    entry.frequency = editedFrequency;
                    entry.band = getHamBand(editedFrequency);
                    entry.mode = editedMode;
                    entry.time = convertLocalToUTC(editedLocalTime);
                    renderLog();
                } else {
                    alert('Please ensure all fields are valid for saving.');
                }
            } else {
                listItem.classList.add('editing');
                e.target.textContent = 'Save';

                const logEntryInfo = listItem.querySelector('.log-entry-info');
                logEntryInfo.innerHTML = `
                    <label>Contact Callsign: <input type="text" class="edit-callsign" value="${entry.callSign}" required></label>
                    <label>Frequency (MHz): <input type="number" step="0.001" class="edit-frequency" value="${entry.frequency}" required></label>
                    <label>Band: <input type="text" class="edit-band" value="${entry.band}" readonly></label>
                    <label>Mode: <select class="edit-mode" required>
                        <option value="SSB" ${entry.mode === 'SSB' ? 'selected' : ''}>SSB</option>
                        <option value="CW" ${entry.mode === 'CW' ? 'selected' : ''}>CW</option>
                        <option value="FM" ${entry.mode === 'FM' ? 'selected' : ''}>FM</option>
                        <option value="AM" ${entry.mode === 'AM' ? 'selected' : ''}>AM</option>
                        <option value="FT8" ${entry.mode === 'FT8' ? 'selected' : ''}>FT8</option>
                        <option value="PSK31" ${entry.mode === 'PSK31' ? 'selected' : ''}>PSK31</option>
                        <option value="RTTY" ${entry.mode === 'RTTY' ? 'selected' : ''}>RTTY</option>
                        <option value="SSTV" ${entry.mode === 'SSTV' ? 'selected' : ''}>SSTV</option>
                        <option value="FT4" ${entry.mode === 'FT4' ? 'selected' : ''}>FT4</option>
                        <option value="JS8" ${entry.mode === 'JS8' ? 'selected' : ''}>JS8</option>
                        <option value="FST4" ${entry.mode === 'FST4' ? 'selected' : ''}>FST4</option>
                        <option value="MSK144" ${entry.mode === 'MSK144' ? 'selected' : ''}>MSK144</option>
                    </select></label>
                    <label>Time (Local for Input, UTC for Log): <input type="datetime-local" class="edit-time" value="${convertUTCToLocalDateTime(entry.time)}" required></label>
                `;

                const editFrequencyInput = listItem.querySelector('.edit-frequency');
                const editBandInput = listItem.querySelector('.edit-band');
                editFrequencyInput.addEventListener('input', () => {
                    const freq = parseFloat(editFrequencyInput.value);
                    editBandInput.value = !isNaN(freq) && freq > 0 ? getHamBand(freq) : '';
                });
            }
        }
    });

    const formatADIFDate = (utcDateTimeString) => {
        if (!utcDateTimeString) return '';
        const date = new Date(utcDateTimeString);
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    };

    const formatADIFTime = (utcDateTimeString) => {
        if (!utcDateTimeString) return '';
        const date = new Date(utcDateTimeString);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${hours}${minutes}${seconds}`;
    };

    saveLogButton.addEventListener('click', () => {
        if (logEntries.length === 0) {
            alert('No log entries to save.');
            return;
        }

        const userCallSign = userCallSignInput.value.trim().toUpperCase();
        const gridSquare = gridSquareInput.value.trim().toUpperCase();
        let adifContent = 'ADIF 3.1.0\r\n';

        if (userCallSign || gridSquare) {
            adifContent += `<PROGRAMID:VU2JDC_Logger>\r\n`;
            adifContent += `<PROGRAMVERSION:1.0>\r\n`;
            if (userCallSign) {
                adifContent += `<OPERATOR:${userCallSign.length}>${userCallSign}\r\n`;
            }
            if (gridSquare) {
                adifContent += `<MY_GRIDSQUARE:${gridSquare.length}>${gridSquare}\r\n`;
            }
        }
        adifContent += '<EOH>\r\n';

        logEntries.forEach(entry => {
            adifContent += `<CALL:${entry.callSign.length}>${entry.callSign}\r\n`;
            adifContent += `<FREQ:${entry.frequency.toFixed(3).length}>${entry.frequency.toFixed(3)}\r\n`;
            adifContent += `<BAND:${entry.band.length}>${entry.band}\r\n`;
            adifContent += `<MODE:${entry.mode.length}>${entry.mode}\r\n`;
            adifContent += `<QSO_DATE:${formatADIFDate(entry.time).length}>${formatADIFDate(entry.time)}\r\n`;
            adifContent += `<TIME_ON:${formatADIFTime(entry.time).length}>${formatADIFTime(entry.time)}\r\n`;
            adifContent += '<EOR>\r\n';
        });

        const fileName = `${userCallSign || 'Ham'}${gridSquare ? '_' + gridSquare : ''}_QSO_Log.adi`;
        const blob = new Blob([adifContent], { type: 'application/adif' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    });

    loadFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.adi')) {
            alert('Please select an ADIF file (.adi).');
            loadFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const adifContent = event.target.result;
                const newLogEntries = [];

                const recordParts = adifContent.split('<EOR>');
                recordParts.forEach(part => {
                    const normalizedPart = part.replace(/\s+/g, ' ').trim();
                    const callMatch = /<CALL:(\d+)>([^<]+)/i.exec(normalizedPart);
                    const freqMatch = /<FREQ:(\d+\.?\d*)>([^<]+)/i.exec(normalizedPart);
                    const bandMatch = /<BAND:(\d+)>([^<]+)/i.exec(normalizedPart);
                    const modeMatch = /<MODE:(\d+)>([^<]+)/i.exec(normalizedPart);
                    const qsoDateMatch = /<QSO_DATE:(\d+)>([^<]+)/i.exec(normalizedPart);
                    const timeOnMatch = /<TIME_ON:(\d+)>([^<]+)/i.exec(normalizedPart);

                    if (callMatch && freqMatch && bandMatch && modeMatch && qsoDateMatch && timeOnMatch) {
                        const callSign = callMatch[2];
                        const frequency = parseFloat(freqMatch[2]);
                        const band = bandMatch[2];
                        const mode = modeMatch[2];
                        const qsoDate = qsoDateMatch[2];
                        const timeOn = timeOnMatch[2];
                        const timeOnPadded = timeOn.padEnd(6, '0');
                        const utcDateTimeString = `${qsoDate.substring(0, 4)}-${qsoDate.substring(4, 6)}-${qsoDate.substring(6, 8)}T${timeOnPadded.substring(0, 2)}:${timeOnPadded.substring(2, 4)}:${timeOnPadded.substring(4, 6)}Z`;

                        newLogEntries.push({
                            callSign: callSign,
                            frequency: frequency,
                            band: band,
                            mode: mode,
                            time: utcDateTimeString
                        });
                    }
                });

                if (newLogEntries.length > 0) {
                    logEntries = newLogEntries;
                    renderLog();
                } else {
                    alert('No valid ADIF entries found in the file or file is malformed. This logger tries to be flexible, but some ADIF files may vary greatly.');
                }
            } catch (error) {
                console.error('Error parsing ADIF file:', error);
                alert('Error reading ADIF file. Please ensure it is a valid ADIF format.');
            }
        };
        reader.readAsText(file);
        loadFileInput.value = '';
    });
});