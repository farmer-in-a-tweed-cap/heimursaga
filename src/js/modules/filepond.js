import * as FilePond from 'filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginFileEncode from 'filepond-plugin-file-encode'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css'
import FilePondPluginImageCrop from 'filepond-plugin-image-crop'
import FilePondPluginImageResize from 'filepond-plugin-image-resize'
import FilePondPluginImageTransform from 'filepond-plugin-image-transform'
import FilePondPluginImageEdit from 'filepond-plugin-image-edit'
import 'filepond-plugin-image-edit/dist/filepond-plugin-image-edit.css'

/*
We need to register the required plugins to do image manipulation and previewing.
*/
FilePond.registerPlugin(
	
	// validates files based on input type
  FilePondPluginFileValidateType,
	
	// corrects mobile image orientation
  FilePondPluginImageExifOrientation,
	
	// previews the image
  FilePondPluginImagePreview,
	
	// crops the image to a certain aspect ratio
  FilePondPluginImageCrop,
	
	// resizes the image to fit a certain size
  FilePondPluginImageResize,
	
	// applies crop and resize information on the client
  FilePondPluginImageTransform
);

// Select the file input and use create() to turn it into a pond
// in this example we pass properties along with the create method
// we could have also put these on the file input element itself
FilePond.create(
	document.querySelector('input[type="file"]'),
	{
    storeAsFile: true,
		labelIdle: `<span class="filepond--label-action">Select a photo</span>`,
    imagePreviewMinHeight: 100,
    imagePreviewMaxHeight: 400,
    imageCropAspectRatio: '3:2',
    imageResizeTargetWidth: 900,
    imageResizeTargetHeight: 600,
    //stylePanelLayout: 'compact',
    styleLoadIndicatorPosition: 'center left',
    styleButtonRemoveItemPosition: 'center bottom',
    credits: false,

	}
);