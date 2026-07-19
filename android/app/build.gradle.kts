plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "ai.timesovereignty.privateapp"
    compileSdk = 35

    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        applicationId = "ai.timesovereignty.privateapp"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "2.0.0-private-alpha"
        buildConfigField(
            "String",
            "PRIVATE_API_BASE_URL",
            "\"https://v2-private---time-sovereignty-defqnamrrq-de.a.run.app\""
        )
        buildConfigField(
            "String",
            "PRIVATE_PWA_BASE_URL",
            "\"https://live-mobile---time-sovereignty-defqnamrrq-de.a.run.app\""
        )
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:34.13.0"))
    implementation("com.google.firebase:firebase-messaging")
    implementation("androidx.activity:activity-ktx:1.9.2")
    testImplementation("junit:junit:4.13.2")
}
