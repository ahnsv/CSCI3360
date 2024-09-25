'use client'

import {useState, useCallback} from 'react'
import {useDropzone, DropzoneOptions} from 'react-dropzone'
import {Upload, FileText, AlertCircle, ChevronDown, ChevronUp} from 'lucide-react'
import {Button} from "@/components/ui/button"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {API_ENDPOINT} from "@/components/chatroom/room";

// Mock function to simulate backend processing
const uploadFileAndGetCurrentData = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const uploadResponse = await fetch(`${API_ENDPOINT}/upload`, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
        },
        body: formData,
    })
    if (!uploadResponse.ok) {
        throw new Error('Upload failed')
    }

    const getCurrentDataResponse = await fetch(`${API_ENDPOINT}/current-data`)
    if (!getCurrentDataResponse.ok) {
        throw new Error('Current data is not available')
    }

    return await getCurrentDataResponse.json() as Record<string, unknown>[]
}

export default function CSVUploader() {
    const [preview, setPreview] = useState<any[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isPreviewVisible, setIsPreviewVisible] = useState(true)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError(null)
        setPreview(null)

        if (acceptedFiles.length === 0) {
            setError('Please upload a CSV file.')
            return
        }

        const file = acceptedFiles[0]

        if (file.size > 1024 * 1024) {
            setError('File size must be less than 1 MB.')
            return
        }

        if (file.type !== 'text/csv') {
            setError('Only CSV files are allowed.')
            return
        }

        setIsLoading(true)

        try {
            const data = await uploadFileAndGetCurrentData(file)
            setPreview(data)
            setIsPreviewVisible(true)
        } catch (err) {
            setError('An error occurred while processing the file.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv']
        },
        maxSize: 1024 * 1024, // 1 MB
        multiple: false,
        onDragEnter: () => {
        },
        onDragLeave: () => {
        },
        onDragOver: () => {
        }
    } as DropzoneOptions)

    const togglePreview = () => {
        setIsPreviewVisible(!isPreviewVisible)
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
                }`}
            >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400"/>
                <p className="mt-2 text-sm text-gray-600">
                    Drag and drop a CSV file here, or click to select a file
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    (Only CSV files up to 1 MB are accepted)
                </p>
            </div>

            {isLoading && (
                <div className="mt-4 text-center">
                    <FileText className="animate-pulse mx-auto h-8 w-8 text-primary"/>
                    <p className="mt-2 text-sm text-gray-600">Processing file...</p>
                </div>
            )}

            {error && (
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {preview && (
                <div className="mt-8 flex flex-col mx-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePreview}
                        className="flex items-center gap-2"
                    >
                        {isPreviewVisible ? (
                            <>
                                Collapse Preview
                                <ChevronUp className="h-4 w-4"/>
                            </>
                        ) : (
                            <>
                                Expand Preview
                                <ChevronDown className="h-4 w-4"/>
                            </>
                        )}
                    </Button>
                    {isPreviewVisible && (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Data Preview</h2>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {Object.keys(preview[0]).map((key) => (
                                            <TableHead key={key}>{key}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {preview.map((row, index) => (
                                        <TableRow key={index}>
                                            {Object.values(row).map((value: any, cellIndex) => (
                                                <TableCell key={cellIndex}>{value}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </div>
            )}

            {/*{preview && (*/}
            {/*    <div className="mt-4 text-center">*/}
            {/*        <Button onClick={() => {*/}
            {/*            setPreview(null);*/}
            {/*            setError(null);*/}
            {/*        }}>*/}
            {/*            Upload Another File*/}
            {/*        </Button>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    )
}