package com.financialmanager.app;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import org.json.JSONObject;

import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    private String pendingSharedText = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null && type.startsWith("image/")) {
            Uri imageUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (imageUri != null) {
                processImageWithMLKit(imageUri);
            }
        }
    }

    private void processImageWithMLKit(Uri imageUri) {
        executorService.execute(() -> {
            try {
                InputStream inputStream = getContentResolver().openInputStream(imageUri);
                if (inputStream == null) return;
                Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
                inputStream.close();

                if (bitmap == null) return;

                InputImage image = InputImage.fromBitmap(bitmap, 0);
                TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);

                recognizer.process(image)
                    .addOnSuccessListener(visionText -> {
                        String recognizedText = visionText.getText();
                        Log.d(TAG, "ML Kit OCR recognized text: " + recognizedText);
                        dispatchOcrResultToWebView(recognizedText);
                    })
                    .addOnFailureListener(e -> {
                        Log.e(TAG, "ML Kit OCR recognition failed", e);
                    });
            } catch (Exception e) {
                Log.e(TAG, "Error reading shared image", e);
            }
        });
    }

    private void dispatchOcrResultToWebView(String text) {
        if (text == null) return;
        pendingSharedText = text;

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    JSONObject payload = new JSONObject();
                    payload.put("rawText", text);
                    payload.put("source", "android_share_intent");

                    String js = "window.__pendingSharedReceiptText = " + JSONObject.quote(text) + ";" +
                                "window.dispatchEvent(new CustomEvent('bankReceiptShared', { detail: " + payload.toString() + " }));";
                    
                    getBridge().getWebView().evaluateJavascript(js, null);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to evaluate JS for shared receipt", e);
            }
        }, 800);
    }
}
